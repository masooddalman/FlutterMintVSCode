import * as vscode from 'vscode';
import { getWorkspacePath, loadForgeConfig } from '../utils/config';
import { CONFIGURABLE_MODULES } from '../utils/constants';
import { SidebarWebviewProvider } from '../views/sidebarWebviewProvider';
import { ConfigModulePanel } from '../views/configModulePanel';
import { ConfigModuleOption } from '../views/configModuleHtml';

export function registerConfigModuleCommand(
  context: vscode.ExtensionContext,
  sidebar: SidebarWebviewProvider
) {
  const command = vscode.commands.registerCommand('flutterforge.configModule', async () => {
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

    const configurable = CONFIGURABLE_MODULES.filter(m => config.modules.includes(m.label));
    if (configurable.length === 0) {
      vscode.window.showInformationMessage('No configurable modules installed. Add "cicd" or "flavors" first.');
      return;
    }

    const modules: ConfigModuleOption[] = configurable.map(m => ({
      value: m.label,
      label: m.label,
      description: m.description,
    }));

    ConfigModulePanel.show(context, sidebar, projectPath, modules);
  });

  context.subscriptions.push(command);
}
