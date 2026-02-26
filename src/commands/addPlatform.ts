import * as vscode from 'vscode';
import { getWorkspacePath, loadForgeConfig } from '../utils/config';
import { AVAILABLE_PLATFORMS } from '../utils/constants';
import { runInTerminal } from '../cli/terminalRunner';
import { SidebarWebviewProvider } from '../views/sidebarWebviewProvider';
import { WizardPanel } from '../views/wizardPanel';
import { WizardConfig } from '../views/wizardFields';

export function registerAddPlatformCommand(
  context: vscode.ExtensionContext,
  sidebar: SidebarWebviewProvider
) {
  const command = vscode.commands.registerCommand('flutterforge.addPlatform', async () => {
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

    const available = AVAILABLE_PLATFORMS.filter(p => !config.platforms.includes(p.label));
    if (available.length === 0) {
      vscode.window.showInformationMessage('All platforms are already enabled.');
      return;
    }

    const wizardConfig: WizardConfig = {
      id: 'flutterforge.wizard.addPlatform',
      title: 'Add Platform',
      fields: [
        {
          type: 'checkbox-grid',
          id: 'platforms',
          label: 'Select Platforms to Add',
          required: true,
          columns: 3,
          options: available.map(p => ({
            value: p.label,
            label: p.label,
            description: p.description,
            checked: false,
          })),
        },
      ],
      submitLabel: 'Add Platforms',
    };

    const result = await WizardPanel.show<{ platforms: string[] }>(context, wizardConfig);
    if (!result || result.platforms.length === 0) { return; }

    runInTerminal('Add Platform', ['platform', 'add', ...result.platforms], projectPath);
    sidebar.refresh();
  });

  context.subscriptions.push(command);
}
