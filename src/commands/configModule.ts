import * as vscode from 'vscode';
import { getWorkspacePath, loadForgeConfig } from '../utils/config';
import { CONFIGURABLE_MODULES } from '../utils/constants';
import { runInTerminal } from '../cli/terminalRunner';
import { WizardPanel } from '../views/wizardPanel';
import { WizardConfig } from '../views/wizardFields';

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

    const wizardConfig: WizardConfig = {
      id: 'flutterforge.wizard.configModule',
      title: 'Configure Module',
      fields: [
        {
          type: 'radio-grid',
          id: 'module',
          label: 'Select Module to Configure',
          required: true,
          columns: 2,
          options: configurable.map(m => ({
            value: m.label,
            label: m.label,
            description: m.description,
          })),
        },
      ],
      submitLabel: 'Configure',
    };

    const result = await WizardPanel.show<{ module: string }>(context, wizardConfig);
    if (!result) { return; }

    runInTerminal('Configure', ['config', result.module], projectPath);
  });

  context.subscriptions.push(command);
}
