import * as vscode from 'vscode';
import { getWorkspacePath, loadMintConfig } from '../utils/config';
import { AVAILABLE_MODULES, MODULE_DEPENDENTS } from '../utils/constants';
import { SidebarWebviewProvider } from '../views/sidebarWebviewProvider';
import { RemoveModulePanel } from '../views/removeModulePanel';
import { RemoveModuleOption } from '../views/removeModuleHtml';

const DEFAULT_MODULES = ['mvvm', 'logging'];

export function registerRemoveModuleCommand(
  context: vscode.ExtensionContext,
  sidebar: SidebarWebviewProvider
) {
  const command = vscode.commands.registerCommand('fluttermint.removeModule', async () => {
    const projectPath = getWorkspacePath();
    if (!projectPath) {
      vscode.window.showErrorMessage('No workspace folder open.');
      return;
    }

    const config = loadMintConfig(projectPath);
    if (!config) {
      vscode.window.showErrorMessage('No FlutterMint project found in this workspace.');
      return;
    }

    const removable = config.modules.filter(m => !DEFAULT_MODULES.includes(m));
    if (removable.length === 0) {
      vscode.window.showInformationMessage('No removable modules. Default modules (mvvm, logging) cannot be removed.');
      return;
    }

    const modules: RemoveModuleOption[] = removable.map(m => {
      const info = AVAILABLE_MODULES.find(am => am.label === m);
      const dependents = (MODULE_DEPENDENTS[m] || [])
        .filter(d => config.modules.includes(d));
      return {
        value: m,
        label: m,
        description: info?.description || '',
        depNote: dependents.length > 0 ? `Also removes: ${dependents.join(', ')}` : undefined,
      };
    });

    RemoveModulePanel.show(context, sidebar, projectPath, modules);
  });

  context.subscriptions.push(command);
}
