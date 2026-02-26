import * as vscode from 'vscode';
import { getWorkspacePath, loadForgeConfig } from '../utils/config';
import { AVAILABLE_MODULES } from '../utils/constants';
import { runInTerminal } from '../cli/terminalRunner';
import { SidebarWebviewProvider } from '../views/sidebarWebviewProvider';

export function registerAddModuleCommand(
  context: vscode.ExtensionContext,
  sidebar: SidebarWebviewProvider
) {
  const command = vscode.commands.registerCommand('flutterforge.addModule', async () => {
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

    const available = AVAILABLE_MODULES.filter(m => !config.modules.includes(m.label));
    if (available.length === 0) {
      vscode.window.showInformationMessage('All modules are already installed.');
      return;
    }

    const selected = await vscode.window.showQuickPick(
      available.map(m => ({ label: m.label, description: m.description })),
      { placeHolder: 'Select module to add' }
    );

    if (!selected) {
      return;
    }

    runInTerminal('Add Module', ['add', selected.label], projectPath);
    sidebar.refresh();
  });

  context.subscriptions.push(command);
}
