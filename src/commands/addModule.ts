import * as vscode from 'vscode';
import { getWorkspacePath, loadForgeConfig } from '../utils/config';
import { AVAILABLE_MODULES, MODULE_DEPENDENCIES } from '../utils/constants';
import { SidebarWebviewProvider } from '../views/sidebarWebviewProvider';
import { AddModulePanel } from '../views/addModulePanel';
import { AddModuleOption } from '../views/addModuleHtml';

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

    const modules: AddModuleOption[] = available.map(m => {
      const deps = (MODULE_DEPENDENCIES[m.label] || [])
        .filter(d => !config.modules.includes(d));
      return {
        value: m.label,
        label: m.label,
        description: m.description,
        depNote: deps.length > 0 ? `Also adds: ${deps.join(', ')}` : undefined,
      };
    });

    AddModulePanel.show(context, sidebar, projectPath, modules);
  });

  context.subscriptions.push(command);
}
