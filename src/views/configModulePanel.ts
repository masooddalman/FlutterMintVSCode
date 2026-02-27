import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { generateConfigModuleHtml, ConfigModuleOption } from './configModuleHtml';
import { SidebarWebviewProvider } from './sidebarWebviewProvider';

interface FlavorsConfig {
  envNames: string;
  envs: Array<{ apiUrl: string; appSuffix: string; idSuffix: string }>;
  defaultEnv: string;
}

interface CicdConfig {
  steps: number[];
  branches: string;
  platforms: number[];
}

export class ConfigModulePanel {
  private panel: vscode.WebviewPanel;
  private proc: ChildProcess | undefined;
  private moduleName = '';

  private constructor(
    private context: vscode.ExtensionContext,
    private sidebar: SidebarWebviewProvider,
    private projectPath: string,
    modules: ConfigModuleOption[],
  ) {
    const nonce = this.getNonce();

    this.panel = vscode.window.createWebviewPanel(
      'flutterforge.configModule',
      'Configure Module',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [context.extensionUri],
      }
    );

    this.panel.webview.html = generateConfigModuleHtml(nonce, modules);

    this.panel.webview.onDidReceiveMessage(
      (msg) => this.handleMessage(msg),
      undefined,
      context.subscriptions,
    );

    this.panel.onDidDispose(() => {
      if (this.proc) {
        this.proc.kill();
        this.proc = undefined;
      }
    });
  }

  static show(
    context: vscode.ExtensionContext,
    sidebar: SidebarWebviewProvider,
    projectPath: string,
    modules: ConfigModuleOption[],
  ): void {
    new ConfigModulePanel(context, sidebar, projectPath, modules);
  }

  private async handleMessage(msg: Record<string, unknown>): Promise<void> {
    switch (msg.type) {
      case 'configModule': {
        this.moduleName = msg.module as string;
        if (this.moduleName === 'flavors') {
          this.reconfigureFlavors(msg.flavorsConfig as FlavorsConfig);
        } else if (this.moduleName === 'cicd') {
          this.reconfigureCicd(msg.cicdConfig as CicdConfig);
        }
        break;
      }

      case 'close': {
        this.panel.dispose();
        break;
      }
    }
  }

  /**
   * Reconfigure flavors by: remove module → re-add module → configure fresh.
   * The CLI's `config flavors` on an existing project shows an interactive menu
   * (1=add, 2=remove, 3=edit env) which is hard to navigate via stdin.
   * Removing and re-adding resets to a fresh state where `config flavors`
   * goes straight to the full setup flow.
   */
  private reconfigureFlavors(flavorsConfig: FlavorsConfig): void {
    this.sendProgress('Removing current flavors config...');
    this.sendOutput('--- Step 1/3: Removing flavors module ---\n');

    this.runCliProcess(['remove', 'flavors'], ['y'], () => {
      this.sendOutput('\n--- Step 2/3: Re-adding flavors module ---\n');
      this.sendProgress('Re-adding flavors module...');

      this.runCliProcess(['add', 'flavors'], ['y'], () => {
        this.sendOutput('\n--- Step 3/3: Configuring flavors ---\n');
        this.sendProgress('Configuring flavors...');

        // Fresh config flow: env names → per-env config → default env → confirm
        const answers: string[] = [];
        answers.push(flavorsConfig.envNames);
        for (const env of flavorsConfig.envs) {
          answers.push(env.apiUrl);
          answers.push(env.appSuffix);
          answers.push(env.idSuffix);
          answers.push('n'); // no custom keys
        }
        answers.push(flavorsConfig.defaultEnv);
        answers.push('y'); // confirm

        this.runCliProcess(['config', 'flavors'], answers, () => {
          this.sendComplete();
        });
      });
    });
  }

  /**
   * Reconfigure CI/CD by: remove module → re-add module → configure fresh.
   */
  private reconfigureCicd(cicdConfig: CicdConfig): void {
    this.sendProgress('Removing current CI/CD config...');
    this.sendOutput('--- Step 1/3: Removing cicd module ---\n');

    this.runCliProcess(['remove', 'cicd'], ['y'], () => {
      this.sendOutput('\n--- Step 2/3: Re-adding cicd module ---\n');
      this.sendProgress('Re-adding cicd module...');

      this.runCliProcess(['add', 'cicd'], ['y'], () => {
        this.sendOutput('\n--- Step 3/3: Configuring CI/CD ---\n');
        this.sendProgress('Configuring CI/CD...');

        const answers: string[] = [];
        answers.push(cicdConfig.steps.join(','));
        answers.push(cicdConfig.branches || '');

        const platformStr = (cicdConfig.platforms || [1]).join(',');
        answers.push(platformStr);

        if (cicdConfig.branches) {
          const extraBranches = cicdConfig.branches.split(',').map(b => b.trim()).filter(b => b);
          for (const _ of extraBranches) {
            answers.push(platformStr);
          }
        }

        this.runCliProcess(['config', 'cicd'], answers, () => {
          this.sendComplete();
        });
      });
    });
  }

  /**
   * Run a single CLI process with piped answers, then call onDone on success.
   */
  private runCliProcess(
    cliArgs: string[],
    answers: string[],
    onDone: () => void,
  ): void {
    try {
      const entryPoint = this.getEntryPoint();
      const args = ['run', entryPoint, ...cliArgs];
      const proc = spawn('dart', args, { cwd: this.projectPath, shell: true });
      this.proc = proc;

      proc.stdout?.on('data', (data: Buffer) => this.sendOutput(data.toString()));
      proc.stderr?.on('data', (data: Buffer) => this.sendOutput(data.toString()));

      proc.on('close', (code: number | null) => {
        this.proc = undefined;
        if (code === 0) {
          onDone();
        } else {
          this.sendError(`Process exited with code ${code}`);
        }
      });

      proc.on('error', (err: Error) => {
        this.proc = undefined;
        this.sendError(`Failed to run dart: ${err.message}`);
      });

      this.pipeAnswers(proc, answers);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.sendError(message);
    }
  }

  private pipeAnswers(proc: ChildProcess, answers: string[]): void {
    let i = 0;
    const writeNext = () => {
      if (i < answers.length && proc.stdin && !proc.stdin.destroyed) {
        proc.stdin.write(answers[i] + '\n');
        i++;
        setTimeout(writeNext, 100);
      }
    };
    setTimeout(writeNext, 500);
  }

  private sendOutput(text: string): void {
    this.panel.webview.postMessage({ type: 'output', text });
  }

  private sendProgress(label: string): void {
    this.panel.webview.postMessage({ type: 'progress', label });
  }

  private sendComplete(): void {
    this.panel.webview.postMessage({ type: 'complete', module: this.moduleName });
    this.sidebar.refresh();
  }

  private sendError(message: string): void {
    this.panel.webview.postMessage({ type: 'error', message });
  }

  private getEntryPoint(): string {
    const config = vscode.workspace.getConfiguration('flutterforge');
    const cliPath = config.get<string>('cliPath', '');
    if (!cliPath) {
      throw new Error('FlutterForge CLI path not configured. Set "flutterforge.cliPath" in VS Code settings.');
    }
    return path.join(cliPath, 'bin', 'flutterforge.dart');
  }

  private getNonce(): string {
    let text = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return text;
  }
}
