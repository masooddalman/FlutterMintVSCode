import * as vscode from 'vscode';
import { getWorkspacePath } from '../utils/config';
import { runInTerminal } from '../cli/terminalRunner';

export function registerToggleHttpCommand(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand('flutterforge.toggleHttp', async () => {
    const projectPath = getWorkspacePath();
    if (!projectPath) {
      vscode.window.showErrorMessage('No workspace folder open.');
      return;
    }

    const choice = await vscode.window.showQuickPick(
      [
        { label: 'Enable HTTP', description: 'Allow non-HTTPS connections (Android & iOS)', cmd: 'enable-http' },
        { label: 'Disable HTTP', description: 'Enforce HTTPS-only connections', cmd: 'disable-http' },
      ],
      { placeHolder: 'Toggle HTTP connections' }
    );

    if (!choice) {
      return;
    }

    runInTerminal(choice.label, [choice.cmd], projectPath);
  });

  context.subscriptions.push(command);
}
