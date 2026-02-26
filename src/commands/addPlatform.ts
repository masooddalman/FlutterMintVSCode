import * as vscode from 'vscode';
import { getWorkspacePath, loadForgeConfig } from '../utils/config';
import { AVAILABLE_PLATFORMS } from '../utils/constants';
import { runInTerminal } from '../cli/terminalRunner';
import { SidebarWebviewProvider } from '../views/sidebarWebviewProvider';

export function registerAddPlatformCommand(
  context: vscode.ExtensionContext,
  sidebar: SidebarWebviewProvider
) {
  const command = vscode.commands.registerCommand('flutterforge.addPlatform', async () => {
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

    const available = AVAILABLE_PLATFORMS.filter(p => !config.platforms.includes(p.label));
    if (available.length === 0) {
      vscode.window.showInformationMessage('All platforms are already enabled.');
      return;
    }

    const selected = await vscode.window.showQuickPick(available, {
      canPickMany: true,
      placeHolder: 'Select platforms to add',
    });

    if (!selected || selected.length === 0) {
      return;
    }

    const platformIds = selected.map(s => s.label);
    runInTerminal('Add Platform', ['platform', 'add', ...platformIds], projectPath);
    sidebar.refresh();
  });

  context.subscriptions.push(command);
}
