import * as vscode from 'vscode';
import { getWorkspacePath } from '../utils/config';
import { runInTerminal } from '../cli/terminalRunner';

export function registerBuildCommand(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand('flutterforge.build', () => {
    const projectPath = getWorkspacePath();
    if (!projectPath) {
      vscode.window.showErrorMessage('No workspace folder open.');
      return;
    }

    runInTerminal('Build', ['build'], projectPath);
  });

  context.subscriptions.push(command);
}
