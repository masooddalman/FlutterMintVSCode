import * as vscode from 'vscode';
import { SidebarWebviewProvider } from '../views/sidebarWebviewProvider';
import { getWorkspacePath, loadMintConfig } from '../utils/config';
import { runInTerminal } from '../cli/terminalRunner';
import { WizardPanel } from '../views/wizardPanel';
import { WizardConfig } from '../views/wizardFields';

export function registerAddDbTableCommand(
  context: vscode.ExtensionContext,
  sidebar: SidebarWebviewProvider
) {
  const command = vscode.commands.registerCommand('fluttermint.addDbTable', async () => {
    const projectPath = getWorkspacePath();
    if (!projectPath) {
      vscode.window.showErrorMessage('No workspace folder open.');
      return;
    }

    const config = loadMintConfig(projectPath);
    if (!config || !config.modules.includes('database')) {
      vscode.window.showErrorMessage('The database module is not installed. Add it first via "Add Module".');
      return;
    }

    const wizardConfig: WizardConfig = {
      id: 'fluttermint.wizard.addDbTable',
      title: 'Add Database Table',
      fields: [
        {
          type: 'text',
          id: 'tableName',
          label: 'Table Name',
          placeholder: 'users',
          required: true,
          validationRegex: '^[a-z][a-z0-9_]*$',
          validationMessage: 'Use lowercase letters, numbers, and underscores (e.g. users, order_items)',
        },
        {
          type: 'key-select-list',
          id: 'columns',
          label: 'Columns',
          keyPlaceholder: 'columnName',
          selectOptions: [
            { value: 'String', label: 'String' },
            { value: 'int', label: 'int' },
            { value: 'double', label: 'double' },
            { value: 'bool', label: 'bool' },
            { value: 'DateTime', label: 'DateTime' },
          ],
        },
      ],
      submitLabel: 'Add Table',
    };

    const result = await WizardPanel.show<{
      tableName: string;
      columns: Array<{ key: string; value: string }>;
    }>(context, wizardConfig);

    if (!result) { return; }

    const args = ['db', 'add', result.tableName];
    for (const col of result.columns) {
      if (col.key && col.value) {
        args.push('-c', `${col.key}:${col.value}`);
      }
    }

    runInTerminal('Add DB Table', args, projectPath);
    sidebar.refresh();
  });

  context.subscriptions.push(command);
}
