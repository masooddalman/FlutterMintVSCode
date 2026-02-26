import * as vscode from 'vscode';
import { getWorkspacePath, loadForgeConfig } from '../utils/config';
import { CONFIGURABLE_MODULES } from '../utils/constants';
import { runInTerminal } from '../cli/terminalRunner';

export function registerConfigModuleCommand(context: vscode.ExtensionContext) {
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

    const selected = await vscode.window.showQuickPick(configurable, {
      placeHolder: 'Select module to configure',
    });

    if (!selected) {
      return;
    }

    runInTerminal('Configure', ['config', selected.label], projectPath);
  });

  context.subscriptions.push(command);
}
