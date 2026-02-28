import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { generateAddModuleHtml, AddModuleOption } from './addModuleHtml';
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
  firebaseGroups: string;
  googlePlayPackage: string;
  googlePlayTrack: number;
  testflightBundleId: string;
  publishMode: number;
}

export class AddModulePanel {
  private panel: vscode.WebviewPanel;
  private proc: ChildProcess | undefined;
  private moduleName = '';
  private flavorsConfig: FlavorsConfig | undefined;
  private cicdConfig: CicdConfig | undefined;

  private constructor(
    private context: vscode.ExtensionContext,
    private sidebar: SidebarWebviewProvider,
    private projectPath: string,
    modules: AddModuleOption[],
  ) {
    const nonce = this.getNonce();

    this.panel = vscode.window.createWebviewPanel(
      'fluttermint.addModule',
      'Add Module',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [context.extensionUri],
      }
    );

    this.panel.webview.html = generateAddModuleHtml(nonce, modules);

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
    modules: AddModuleOption[],
  ): void {
    new AddModulePanel(context, sidebar, projectPath, modules);
  }

  private async handleMessage(msg: Record<string, unknown>): Promise<void> {
    switch (msg.type) {
      case 'addModule': {
        this.moduleName = msg.module as string;
        this.flavorsConfig = msg.flavorsConfig as FlavorsConfig | undefined;
        this.cicdConfig = msg.cicdConfig as CicdConfig | undefined;
        this.runAdd(this.moduleName);
        break;
      }

      case 'close': {
        this.panel.dispose();
        break;
      }
    }
  }

  /** Run `add <module>`, pipe "y" for proceed. Then optionally run `config <module>`. */
  private runAdd(module: string): void {
    const entryPoint = this.getEntryPoint();
    const args = ['run', entryPoint, 'add', module];

    this.sendProgress('Adding module...');

    const proc = this.startProcess(args, this.projectPath);
    if (!proc) { return; }

    // Pipe "y" to confirm the "Proceed?" prompt
    this.pipeAnswers(proc, ['y']);
  }

  /** Run `config flavors` after add completes */
  private runConfigFlavors(flavorsConfig: FlavorsConfig): void {
    const entryPoint = this.getEntryPoint();
    const args = ['run', entryPoint, 'config', 'flavors'];

    this.sendOutput('\n--- Configuring Flavors ---\n');
    this.sendProgress('Configuring flavors...');

    const proc = spawn('dart', args, { cwd: this.projectPath, shell: true });
    this.proc = proc;

    proc.stdout?.on('data', (data: Buffer) => this.sendOutput(data.toString()));
    proc.stderr?.on('data', (data: Buffer) => this.sendOutput(data.toString()));

    proc.on('close', (code: number | null) => {
      this.proc = undefined;
      if (code === 0) {
        this.sendComplete();
      } else {
        this.sendError(`Flavors config exited with code ${code}`);
      }
    });

    proc.on('error', (err: Error) => {
      this.proc = undefined;
      this.sendError(`Failed to configure flavors: ${err.message}`);
    });

    // Pipe flavors answers:
    // For new config (no existing), CLI goes straight to full setup:
    //   env names, per-env (apiUrl, appSuffix, idSuffix, "n" for custom keys), default env number, "y" confirm
    const answers: string[] = [];

    // Environment names
    answers.push(flavorsConfig.envNames);

    // Per-environment config
    for (const env of flavorsConfig.envs) {
      answers.push(env.apiUrl);
      answers.push(env.appSuffix);
      answers.push(env.idSuffix);
      answers.push('n'); // no custom keys
    }

    // Default environment
    answers.push(flavorsConfig.defaultEnv);

    // Confirm
    answers.push('y');

    this.pipeAnswers(proc, answers);
  }

  /** Run `config cicd` after add completes */
  private runConfigCicd(): void {
    if (!this.cicdConfig) { return; }

    const entryPoint = this.getEntryPoint();
    const args = ['run', entryPoint, 'config', 'cicd'];

    this.sendOutput('\n--- Configuring CI/CD ---\n');
    this.sendProgress('Configuring CI/CD...');

    const proc = spawn('dart', args, { cwd: this.projectPath, shell: true });
    this.proc = proc;

    proc.stdout?.on('data', (data: Buffer) => this.sendOutput(data.toString()));
    proc.stderr?.on('data', (data: Buffer) => this.sendOutput(data.toString()));

    proc.on('close', (code: number | null) => {
      this.proc = undefined;
      if (code === 0) {
        this.sendComplete();
      } else {
        this.sendError(`CI/CD config exited with code ${code}`);
      }
    });

    proc.on('error', (err: Error) => {
      this.proc = undefined;
      this.sendError(`Failed to configure CI/CD: ${err.message}`);
    });

    const answers: string[] = [];
    const steps = this.cicdConfig.steps;
    const platforms = this.cicdConfig.platforms || [1];

    answers.push(steps.join(','));
    answers.push(this.cicdConfig.branches || '');

    // Platforms per branch (only if step 5 selected)
    if (steps.includes(5)) {
      const platformStr = platforms.join(',');
      answers.push(platformStr);
      if (this.cicdConfig.branches) {
        const extraBranches = this.cicdConfig.branches.split(',').map(b => b.trim()).filter(b => b);
        for (const _ of extraBranches) {
          answers.push(platformStr);
        }
      }
    }

    const hasApkOrAab = platforms.includes(1) || platforms.includes(2);
    const hasAab = platforms.includes(2);
    const hasIos = platforms.includes(4);

    // Firebase tester groups (step 6 + APK/AAB)
    if (steps.includes(6) && steps.includes(5) && hasApkOrAab) {
      answers.push(this.cicdConfig.firebaseGroups || 'testers');
    }

    // Google Play package + track (step 7 + AAB)
    if (steps.includes(7) && steps.includes(5) && hasAab) {
      answers.push(this.cicdConfig.googlePlayPackage || '');
      answers.push(String(this.cicdConfig.googlePlayTrack || 1));
    }

    // TestFlight bundle ID (step 8 + iOS)
    if (steps.includes(8) && steps.includes(5) && hasIos) {
      answers.push(this.cicdConfig.testflightBundleId || '');
    }

    // Publish mode (when Firebase or Google Play is active)
    if ((steps.includes(6) && steps.includes(5) && hasApkOrAab) ||
        (steps.includes(7) && steps.includes(5) && hasAab)) {
      answers.push(String(this.cicdConfig.publishMode || 1));
    }

    // Confirm
    answers.push('y');

    this.pipeAnswers(proc, answers);
  }

  private startProcess(args: string[], cwd: string): ChildProcess | undefined {
    try {
      const proc = spawn('dart', args, { cwd, shell: true });
      this.proc = proc;

      proc.stdout?.on('data', (data: Buffer) => this.sendOutput(data.toString()));
      proc.stderr?.on('data', (data: Buffer) => this.sendOutput(data.toString()));

      proc.on('close', (code: number | null) => {
        this.proc = undefined;
        if (code === 0) {
          // Chain config command if needed
          if (this.moduleName === 'flavors' && this.flavorsConfig) {
            this.runConfigFlavors(this.flavorsConfig);
          } else if (this.moduleName === 'cicd' && this.cicdConfig) {
            this.runConfigCicd();
          } else {
            this.sendComplete();
          }
        } else {
          this.sendError(`Process exited with code ${code}`);
        }
      });

      proc.on('error', (err: Error) => {
        this.proc = undefined;
        this.sendError(`Failed to run dart: ${err.message}`);
      });

      return proc;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.sendError(message);
      return undefined;
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
    const config = vscode.workspace.getConfiguration('fluttermint');
    const cliPath = config.get<string>('cliPath', '');
    if (!cliPath) {
      throw new Error('FlutterMint CLI path not configured. Set "fluttermint.cliPath" in VS Code settings.');
    }
    return path.join(cliPath, 'bin', 'fluttermint.dart');
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
