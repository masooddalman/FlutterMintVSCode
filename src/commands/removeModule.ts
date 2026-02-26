import * as vscode from 'vscode';
import { getWorkspacePath, loadForgeConfig } from '../utils/config';
import { runInTerminal } from '../cli/terminalRunner';
import { SidebarWebviewProvider } from '../views/sidebarWebviewProvider';

const DEFAULT_MODULES = ['mvvm', 'logging'];

export function registerRemoveModuleCommand(
  context: vscode.ExtensionContext,
  sidebar: SidebarWebviewProvider
) {
  const command = vscode.commands.registerCommand('flutterforge.removeModule', async () => {
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

    const removable = config.modules.filter(m => !DEFAULT_MODULES.includes(m));
    if (removable.length === 0) {
      vscode.window.showInformationMessage('No removable modules. Default modules (mvvm, logging) cannot be removed.');
      return;
    }

    const selected = await vscode.window.showQuickPick(
      removable.map(m => ({ label: m })),
      { placeHolder: 'Select module to remove' }
    );

    if (!selected) {
      return;
    }

    runInTerminal('Remove Module', ['remove', selected.label], projectPath);
    sidebar.refresh();
  });

  context.subscriptions.push(command);
}
