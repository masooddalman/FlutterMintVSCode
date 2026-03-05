import * as vscode from 'vscode';
import { SidebarWebviewProvider } from '../views/sidebarWebviewProvider';
import { getWorkspacePath, loadMintConfig } from '../utils/config';
import { runInTerminal } from '../cli/terminalRunner';
import { WizardPanel } from '../views/wizardPanel';
import { WizardConfig } from '../views/wizardFields';

export function registerAddPreferenceCommand(
  context: vscode.ExtensionContext,
  sidebar: SidebarWebviewProvider
) {
  const command = vscode.commands.registerCommand('fluttermint.addPreference', async () => {
    const projectPath = getWorkspacePath();
    if (!projectPath) {
      vscode.window.showErrorMessage('No workspace folder open.');
      return;
    }

    const config = loadMintConfig(projectPath);
    if (!config || !config.modules.includes('preferences')) {
      vscode.window.showErrorMessage('The preferences module is not installed. Add it first via "Add Module".');
      return;
    }

    const wizardConfig: WizardConfig = {
      id: 'fluttermint.wizard.addPreference',
      title: 'Add Preference',
      fields: [
        {
          type: 'text',
          id: 'prefName',
          label: 'Preference Name',
          placeholder: 'userEmail',
          required: true,
          validationRegex: '^[a-z][a-zA-Z0-9]*$',
          validationMessage: 'Use camelCase (e.g. userEmail, darkMode, fontSize)',
        },
        {
          type: 'radio-grid',
          id: 'prefType',
          label: 'Value Type',
          required: true,
          columns: 3,
          options: [
            { value: 'String', label: 'String', description: 'Text value', checked: true },
            { value: 'int', label: 'int', description: 'Integer number' },
            { value: 'double', label: 'double', description: 'Decimal number' },
            { value: 'bool', label: 'bool', description: 'True / False' },
            { value: 'List<String>', label: 'List<String>', description: 'List of strings' },
          ],
        },
      ],
      submitLabel: 'Add Preference',
    };

    const result = await WizardPanel.show<{
      prefName: string;
      prefType: string;
    }>(context, wizardConfig);

    if (!result) { return; }

    const args = ['pref', 'add', result.prefName, '--type', result.prefType];
    runInTerminal('Add Preference', args, projectPath);
    sidebar.refresh();
  });

  context.subscriptions.push(command);
}
