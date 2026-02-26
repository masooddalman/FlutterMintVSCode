import * as vscode from 'vscode';
import { getWorkspacePath, loadForgeConfig } from '../utils/config';
import { AVAILABLE_MODULES } from '../utils/constants';
import { runInTerminal } from '../cli/terminalRunner';
import { SidebarWebviewProvider } from '../views/sidebarWebviewProvider';
import { WizardPanel } from '../views/wizardPanel';
import { WizardConfig } from '../views/wizardFields';

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

    const wizardConfig: WizardConfig = {
      id: 'flutterforge.wizard.addModule',
      title: 'Add Module',
      fields: [
        {
          type: 'radio-grid',
          id: 'module',
          label: 'Select Module to Add',
          required: true,
          columns: 3,
          options: available.map(m => ({
            value: m.label,
            label: m.label,
            description: m.description,
          })),
        },
      ],
      submitLabel: 'Add Module',
    };

    const result = await WizardPanel.show<{ module: string }>(context, wizardConfig);
    if (!result) { return; }

    runInTerminal('Add Module', ['add', result.module], projectPath);
    sidebar.refresh();
  });

  context.subscriptions.push(command);
}
