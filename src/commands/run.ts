import * as vscode from 'vscode';
import { getWorkspacePath } from '../utils/config';
import { runInTerminal } from '../cli/terminalRunner';

export function registerRunCommand(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand('fluttermint.run', () => {
    const projectPath = getWorkspacePath();
    if (!projectPath) {
      vscode.window.showErrorMessage('No workspace folder open.');
      return;
    }

    runInTerminal('Run', ['run'], projectPath);
  });

  context.subscriptions.push(command);
}
