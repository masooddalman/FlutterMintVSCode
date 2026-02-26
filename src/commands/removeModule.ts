import * as vscode from 'vscode';
import { getWorkspacePath, loadForgeConfig } from '../utils/config';
import { AVAILABLE_MODULES } from '../utils/constants';
import { runInTerminal } from '../cli/terminalRunner';
import { SidebarWebviewProvider } from '../views/sidebarWebviewProvider';
import { WizardPanel } from '../views/wizardPanel';
import { WizardConfig } from '../views/wizardFields';

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

    const wizardConfig: WizardConfig = {
      id: 'flutterforge.wizard.removeModule',
      title: 'Remove Module',
      fields: [
        {
          type: 'radio-grid',
          id: 'module',
          label: 'Select Module to Remove',
          required: true,
          columns: 3,
          options: removable.map(m => {
            const info = AVAILABLE_MODULES.find(am => am.label === m);
            return {
              value: m,
              label: m,
              description: info?.description || '',
            };
          }),
        },
      ],
      submitLabel: 'Remove Module',
    };

    const result = await WizardPanel.show<{ module: string }>(context, wizardConfig);
    if (!result) { return; }

    runInTerminal('Remove Module', ['remove', result.module], projectPath);
    sidebar.refresh();
  });

  context.subscriptions.push(command);
}
