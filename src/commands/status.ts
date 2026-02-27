import * as vscode from 'vscode';
import { getWorkspacePath } from '../utils/config';
import { StatusPanel } from '../views/statusPanel';

export function registerStatusCommand(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand('flutterforge.status', () => {
    const projectPath = getWorkspacePath();
    if (!projectPath) {
      vscode.window.showErrorMessage('No workspace folder open.');
      return;
    }

    StatusPanel.show(projectPath);
  });

  context.subscriptions.push(command);
}
