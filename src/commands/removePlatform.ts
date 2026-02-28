import * as vscode from 'vscode';
import { getWorkspacePath, loadMintConfig } from '../utils/config';
import { AVAILABLE_PLATFORMS } from '../utils/constants';
import { runInTerminal } from '../cli/terminalRunner';
import { SidebarWebviewProvider } from '../views/sidebarWebviewProvider';
import { WizardPanel } from '../views/wizardPanel';
import { WizardConfig } from '../views/wizardFields';

export function registerRemovePlatformCommand(
  context: vscode.ExtensionContext,
  sidebar: SidebarWebviewProvider
) {
  const command = vscode.commands.registerCommand('fluttermint.removePlatform', async () => {
    const projectPath = getWorkspacePath();
    if (!projectPath) {
      vscode.window.showErrorMessage('No workspace folder open.');
      return;
    }

    const config = loadMintConfig(projectPath);
    if (!config) {
      vscode.window.showErrorMessage('No FlutterMint project found in this workspace.');
      return;
    }

    if (config.platforms.length === 0) {
      vscode.window.showInformationMessage('No platforms are enabled.');
      return;
    }

    const wizardConfig: WizardConfig = {
      id: 'fluttermint.wizard.removePlatform',
      title: 'Remove Platform',
      fields: [
        {
          type: 'checkbox-grid',
          id: 'platforms',
          label: 'Select Platforms to Remove',
          required: true,
          columns: 3,
          options: config.platforms.map(p => {
            const info = AVAILABLE_PLATFORMS.find(ap => ap.label === p);
            return {
              value: p,
              label: p,
              description: info?.description || p,
              checked: false,
            };
          }),
        },
      ],
      submitLabel: 'Remove Platforms',
    };

    const result = await WizardPanel.show<{ platforms: string[] }>(context, wizardConfig);
    if (!result || result.platforms.length === 0) { return; }

    runInTerminal('Remove Platform', ['platform', 'remove', ...result.platforms], projectPath);
    sidebar.refresh();
  });

  context.subscriptions.push(command);
}
