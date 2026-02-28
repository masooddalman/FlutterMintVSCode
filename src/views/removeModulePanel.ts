import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { generateRemoveModuleHtml, RemoveModuleOption } from './removeModuleHtml';
import { SidebarWebviewProvider } from './sidebarWebviewProvider';

export class RemoveModulePanel {
  private panel: vscode.WebviewPanel;
  private proc: ChildProcess | undefined;
  private moduleName = '';

  private constructor(
    private context: vscode.ExtensionContext,
    private sidebar: SidebarWebviewProvider,
    private projectPath: string,
    modules: RemoveModuleOption[],
  ) {
    const nonce = this.getNonce();

    this.panel = vscode.window.createWebviewPanel(
      'fluttermint.removeModule',
      'Remove Module',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [context.extensionUri],
      }
    );

    this.panel.webview.html = generateRemoveModuleHtml(nonce, modules);

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
    modules: RemoveModuleOption[],
  ): void {
    new RemoveModulePanel(context, sidebar, projectPath, modules);
  }

  private async handleMessage(msg: Record<string, unknown>): Promise<void> {
    switch (msg.type) {
      case 'removeModule': {
        this.moduleName = msg.module as string;
        this.runRemove(this.moduleName);
        break;
      }

      case 'close': {
        this.panel.dispose();
        break;
      }
    }
  }

  private runRemove(module: string): void {
    const entryPoint = this.getEntryPoint();
    const args = ['run', entryPoint, 'remove', module];

    this.sendProgress('Removing module...');

    try {
      const proc = spawn('dart', args, { cwd: this.projectPath, shell: true });
      this.proc = proc;

      proc.stdout?.on('data', (data: Buffer) => this.sendOutput(data.toString()));
      proc.stderr?.on('data', (data: Buffer) => this.sendOutput(data.toString()));

      proc.on('close', (code: number | null) => {
        this.proc = undefined;
        if (code === 0) {
          this.panel.webview.postMessage({ type: 'complete', module: this.moduleName });
          this.sidebar.refresh();
        } else {
          this.panel.webview.postMessage({
            type: 'error',
            message: `Process exited with code ${code}`,
          });
        }
      });

      proc.on('error', (err: Error) => {
        this.proc = undefined;
        this.panel.webview.postMessage({
          type: 'error',
          message: `Failed to run dart: ${err.message}`,
        });
      });

      // Pipe "y" to confirm the CLI's "Proceed?" prompt
      this.pipeAnswers(proc, ['y']);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.panel.webview.postMessage({ type: 'error', message });
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
