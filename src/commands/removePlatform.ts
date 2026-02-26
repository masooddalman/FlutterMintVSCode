import * as vscode from 'vscode';
import { getWorkspacePath, loadForgeConfig } from '../utils/config';
import { runInTerminal } from '../cli/terminalRunner';
import { SidebarWebviewProvider } from '../views/sidebarWebviewProvider';

export function registerRemovePlatformCommand(
  context: vscode.ExtensionContext,
  sidebar: SidebarWebviewProvider
) {
  const command = vscode.commands.registerCommand('flutterforge.removePlatform', async () => {
    const projectPath = getWorkspacePath();
    if (!projectPath) {
      vscode.window.showErrorMessage('No workspace folder open.');
      return;
    }

    const config = loadForgeConfig(projectPath);
    if (!config) {
      vscode.window.showErrorMessage('No FlutterForge project found in this workspace.');
      return;
    }

    if (config.platforms.length === 0) {
      vscode.window.showInformationMessage('No platforms are enabled.');
      return;
    }

    // CLI handles interactive removal
    runInTerminal('Remove Platform', ['platform', 'remove'], projectPath);
    sidebar.refresh();
  });

  context.subscriptions.push(command);
}
