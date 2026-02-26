import * as vscode from 'vscode';
import { getWorkspacePath } from '../utils/config';
import { runInTerminal } from '../cli/terminalRunner';

export function registerStatusCommand(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand('flutterforge.status', () => {
    const projectPath = getWorkspacePath();
    if (!projectPath) {
      vscode.window.showErrorMessage('No workspace folder open.');
      return;
    }

    runInTerminal('Status', ['status'], projectPath);
  });

  context.subscriptions.push(command);
}
