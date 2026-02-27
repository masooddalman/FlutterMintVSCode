import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getWorkspacePath } from '../utils/config';
import { runInTerminal } from '../cli/terminalRunner';
import { WizardPanel } from '../views/wizardPanel';
import { WizardConfig } from '../views/wizardFields';

function isHttpEnabled(projectPath: string): boolean {
  const manifest = path.join(projectPath, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
  try {
    const content = fs.readFileSync(manifest, 'utf8');
    return /usesCleartextTraffic\s*=\s*"true"/i.test(content);
  } catch {
    return false;
  }
}

export function registerToggleHttpCommand(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand('flutterforge.toggleHttp', async () => {
    const projectPath = getWorkspacePath();
    if (!projectPath) {
      vscode.window.showErrorMessage('No workspace folder open.');
      return;
    }

    const httpOn = isHttpEnabled(projectPath);

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
            { value: 'enable-http', label: 'Enable HTTP', description: 'Allow non-HTTPS connections (Android & iOS)', checked: httpOn },
            { value: 'disable-http', label: 'Disable HTTP', description: 'Enforce HTTPS-only connections', checked: !httpOn },
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
