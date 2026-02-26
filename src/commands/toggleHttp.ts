import * as vscode from 'vscode';
import { getWorkspacePath } from '../utils/config';
import { runInTerminal } from '../cli/terminalRunner';
import { WizardPanel } from '../views/wizardPanel';
import { WizardConfig } from '../views/wizardFields';

export function registerToggleHttpCommand(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand('flutterforge.toggleHttp', async () => {
    const projectPath = getWorkspacePath();
    if (!projectPath) {
      vscode.window.showErrorMessage('No workspace folder open.');
      return;
    }

    const wizardConfig: WizardConfig = {
      id: 'flutterforge.wizard.toggleHttp',
      title: 'Toggle HTTP',
      fields: [
        {
          type: 'radio-grid',
          id: 'action',
          label: 'HTTP Connection Policy',
          required: true,
          columns: 2,
          options: [
            { value: 'enable-http', label: 'Enable HTTP', description: 'Allow non-HTTPS connections (Android & iOS)' },
            { value: 'disable-http', label: 'Disable HTTP', description: 'Enforce HTTPS-only connections' },
          ],
        },
      ],
      submitLabel: 'Apply',
    };

    const result = await WizardPanel.show<{ action: string }>(context, wizardConfig);
    if (!result) { return; }

    runInTerminal('Toggle HTTP', [result.action], projectPath);
  });

  context.subscriptions.push(command);
}
