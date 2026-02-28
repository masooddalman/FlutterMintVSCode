import * as vscode from 'vscode';
import { SidebarWebviewProvider } from '../views/sidebarWebviewProvider';
import { getWorkspacePath } from '../utils/config';
import { runInTerminal } from '../cli/terminalRunner';
import { WizardPanel } from '../views/wizardPanel';
import { WizardConfig } from '../views/wizardFields';

export function registerAddScreenCommand(
  context: vscode.ExtensionContext,
  sidebar: SidebarWebviewProvider
) {
  const command = vscode.commands.registerCommand('fluttermint.addScreen', async () => {
    const projectPath = getWorkspacePath();
    if (!projectPath) {
      vscode.window.showErrorMessage('No workspace folder open.');
      return;
    }

    const wizardConfig: WizardConfig = {
      id: 'fluttermint.wizard.addScreen',
      title: 'Add Screen',
      fields: [
        {
          type: 'text',
          id: 'screenName',
          label: 'Screen Name',
          placeholder: 'user_profile',
          required: true,
          validationRegex: '^[a-z][a-z0-9_]*$',
          validationMessage: 'Use only lowercase letters, numbers, and underscores',
        },
        {
          type: 'key-value-list',
          id: 'params',
          label: 'Route Parameters (optional)',
          keyPlaceholder: 'paramName',
          valuePlaceholder: 'String',
        },
      ],
      submitLabel: 'Add Screen',
    };

    const result = await WizardPanel.show<{
      screenName: string;
      params: Array<{ key: string; value: string }>;
    }>(context, wizardConfig);

    if (!result) { return; }

    if (result.screenName === 'home') {
      vscode.window.showErrorMessage('"home" screen already exists as the default feature.');
      return;
    }

    // Build CLI args: screen <name> [--param key:Type ...]
    const args = ['screen', result.screenName];
    for (const p of result.params) {
      if (p.key && p.value) {
        args.push('--param', `${p.key}:${p.value}`);
      }
    }

    runInTerminal('Add Screen', args, projectPath);
    sidebar.refresh();
  });

  context.subscriptions.push(command);
}
