import * as vscode from 'vscode';
import { ForgeRunner } from '../cli/forgeRunner';
import { SidebarProvider } from '../views/sidebarProvider';
import { getWorkspacePath } from '../utils/config';

export function registerAddScreenCommand(
  context: vscode.ExtensionContext,
  sidebar: SidebarProvider
) {
  const command = vscode.commands.registerCommand('flutterforge.addScreen', async () => {
    try {
      const projectPath = getWorkspacePath();
      if (!projectPath) {
        vscode.window.showErrorMessage('No workspace folder open.');
        return;
      }

      // Step 1: Screen name
      const screenName = await vscode.window.showInputBox({
        prompt: 'Enter screen name (lowercase, underscores only)',
        placeHolder: 'user_profile',
        validateInput: (value) => {
          if (!value) {
            return 'Screen name is required';
          }
          if (!/^[a-z][a-z0-9_]*$/.test(value)) {
            return 'Use only lowercase letters, numbers, and underscores';
          }
          if (value === 'home') {
            return '"home" screen already exists as the default feature';
          }
          return null;
        },
      });

      if (!screenName) {
        return;
      }

      // Step 2: Route parameters (optional)
      const paramsInput = await vscode.window.showInputBox({
        prompt: 'Route parameters (optional, comma-separated name:Type)',
        placeHolder: 'id:String, category:String',
      });

      const params = new Map<string, string>();
      if (paramsInput) {
        const pairs = paramsInput.split(',').map((s) => s.trim());
        for (const pair of pairs) {
          const [key, type] = pair.split(':').map((s) => s.trim());
          if (key && type) {
            params.set(key, type);
          }
        }
      }

      // Step 3: Run FlutterForge
      const runner = new ForgeRunner();
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `FlutterForge: Adding screen "${screenName}"...`,
          cancellable: false,
        },
        async () => {
          await runner.addScreen(screenName, params, projectPath);
        }
      );

      vscode.window.showInformationMessage(`Screen "${screenName}" created successfully!`);
      sidebar.refresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`FlutterForge: ${message}`);
    }
  });

  context.subscriptions.push(command);
}
