import * as vscode from 'vscode';
import { SidebarWebviewProvider } from '../views/sidebarWebviewProvider';
import { getWorkspacePath, loadMintConfig, getDbTables } from '../utils/config';
import { runInTerminal } from '../cli/terminalRunner';
import { WizardPanel } from '../views/wizardPanel';
import { WizardConfig } from '../views/wizardFields';

export function registerRemoveDbTableCommand(
  context: vscode.ExtensionContext,
  sidebar: SidebarWebviewProvider
) {
  const command = vscode.commands.registerCommand('fluttermint.removeDbTable', async () => {
    const projectPath = getWorkspacePath();
    if (!projectPath) {
      vscode.window.showErrorMessage('No workspace folder open.');
      return;
    }

    const config = loadMintConfig(projectPath);
    if (!config || !config.modules.includes('database')) {
      vscode.window.showErrorMessage('The database module is not installed.');
      return;
    }

    const tables = getDbTables(projectPath);
    if (tables.length === 0) {
      vscode.window.showInformationMessage('No database tables found.');
      return;
    }

    const wizardConfig: WizardConfig = {
      id: 'fluttermint.wizard.removeDbTable',
      title: 'Remove Database Table',
      fields: [
        {
          type: 'radio-grid',
          id: 'tableName',
          label: 'Select table to remove',
          required: true,
          columns: 1,
          options: tables.map(t => ({
            value: t.name,
            label: t.name,
            description: t.columns.map(c => `${c.name}: ${c.type}`).join(', '),
          })),
        },
      ],
      submitLabel: 'Remove Table',
    };

    const result = await WizardPanel.show<{ tableName: string }>(context, wizardConfig);
    if (!result) { return; }

    runInTerminal('Remove DB Table', ['db', 'remove', result.tableName], projectPath);
    sidebar.refresh();
  });

  context.subscriptions.push(command);
}
