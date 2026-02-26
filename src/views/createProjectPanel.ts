import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import { generateCreateProjectHtml } from './createProjectHtml';
import { SidebarWebviewProvider } from './sidebarWebviewProvider';
import { AVAILABLE_MODULES } from '../utils/constants';

/** Order of optional modules the CLI asks about interactively (must match CLI's ModuleRegistry.optionalModules) */
const OPTIONAL_MODULE_ORDER = AVAILABLE_MODULES
  .filter(m => !m.picked)
  .map(m => m.label);

export class CreateProjectPanel {
  private panel: vscode.WebviewPanel;
  private projectName = '';
  private targetDir = '';
  private proc: ChildProcess | undefined;

  private constructor(
    private context: vscode.ExtensionContext,
    private sidebar: SidebarWebviewProvider,
  ) {
    const nonce = this.getNonce();

    this.panel = vscode.window.createWebviewPanel(
      'flutterforge.createProject',
      'Create Project',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [context.extensionUri],
      }
    );

    this.panel.webview.html = generateCreateProjectHtml(nonce);

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

  static show(context: vscode.ExtensionContext, sidebar: SidebarWebviewProvider): void {
    new CreateProjectPanel(context, sidebar);
  }

  private async handleMessage(msg: Record<string, unknown>): Promise<void> {
    switch (msg.type) {
      case 'browseDirectory': {
        const uri = await vscode.window.showOpenDialog({
          canSelectFolders: true,
          canSelectFiles: false,
          canSelectMany: false,
          openLabel: 'Select Directory',
        });
        if (uri && uri.length > 0) {
          this.panel.webview.postMessage({
            type: 'directorySelected',
            path: uri[0].fsPath,
          });
        }
        break;
      }

      case 'quickCreate': {
        this.projectName = msg.name as string;
        this.targetDir = msg.targetDir as string;
        this.runQuickCreate(this.projectName, this.targetDir);
        break;
      }

      case 'fullCreate': {
        this.projectName = msg.name as string;
        this.targetDir = msg.targetDir as string;
        const org = msg.org as string;
        const modules = msg.modules as string[];
        this.runFullCreate(this.projectName, org, modules, this.targetDir);
        break;
      }

      case 'openProject': {
        const projectPath = vscode.Uri.file(path.join(this.targetDir, this.projectName));
        await vscode.commands.executeCommand('vscode.openFolder', projectPath);
        break;
      }

      case 'openProjectNewWindow': {
        const projectPath = vscode.Uri.file(path.join(this.targetDir, this.projectName));
        await vscode.commands.executeCommand('vscode.openFolder', projectPath, true);
        break;
      }
    }
  }

  /** Quick create: `create <appname>` — uses CLI defaults for everything */
  private runQuickCreate(name: string, targetDir: string): void {
    const entryPoint = this.getEntryPoint();
    const args = ['run', entryPoint, 'create', name];
    this.startProcess(args, targetDir);
  }

  /** Full create: `create` interactive mode with stdin piping */
  private runFullCreate(name: string, org: string, selectedModules: string[], targetDir: string): void {
    const entryPoint = this.getEntryPoint();
    const args = ['run', entryPoint, 'create'];

    const proc = this.startProcess(args, targetDir);
    if (!proc || !proc.stdin) { return; }

    // Build stdin answers
    const answers: string[] = [];

    // 1. App name
    answers.push(name);
    // 2. Organization
    answers.push(org);
    // 3. For each optional module in order: y or n
    for (const moduleId of OPTIONAL_MODULE_ORDER) {
      answers.push(selectedModules.includes(moduleId) ? 'y' : 'n');
    }
    // 4. Optional platforms: n for all (web, macos, windows, linux) — use defaults (android, ios)
    answers.push('n', 'n', 'n', 'n');
    // 5. Confirm creation
    answers.push('Y');

    // Pipe answers line by line with a small delay to let the CLI process each prompt
    let i = 0;
    const writeNext = () => {
      if (i < answers.length && proc.stdin && !proc.stdin.destroyed) {
        proc.stdin.write(answers[i] + '\n');
        i++;
        setTimeout(writeNext, 100);
      }
    };
    // Start writing after a short delay to let the CLI initialize
    setTimeout(writeNext, 500);
  }

  private startProcess(args: string[], cwd: string): ChildProcess | undefined {
    try {
      const proc = spawn('dart', args, { cwd, shell: true });
      this.proc = proc;

      proc.stdout?.on('data', (data: Buffer) => {
        const text = data.toString();
        this.sendOutput(text);
        this.parseProgress(text);
      });

      proc.stderr?.on('data', (data: Buffer) => {
        this.sendOutput(data.toString());
      });

      proc.on('close', (code: number | null) => {
        this.proc = undefined;
        if (code === 0) {
          this.panel.webview.postMessage({
            type: 'complete',
            name: this.projectName,
          });
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

      return proc;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.panel.webview.postMessage({
        type: 'error',
        message,
      });
      return undefined;
    }
  }

  private sendOutput(text: string): void {
    this.panel.webview.postMessage({ type: 'output', text });
  }

  private parseProgress(text: string): void {
    // CLI outputs lines like "  [1] Creating Flutter project..."
    const match = text.match(/\[(\d+)\]/);
    if (match) {
      const step = parseInt(match[1], 10);
      this.panel.webview.postMessage({
        type: 'progress',
        step,
        total: 7,
      });
    }
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
