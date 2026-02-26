import * as vscode from 'vscode';
import { ForgeRunner } from '../cli/forgeRunner';
import { SidebarProvider } from '../views/sidebarProvider';

const AVAILABLE_MODULES = [
  { label: 'logging', description: 'Logging Service', picked: true },
  { label: 'locator', description: 'Dependency Injection (GetIt)', picked: true },
  { label: 'theming', description: 'Theme Management', picked: true },
  { label: 'routing', description: 'Routing (GoRouter)', picked: true },
  { label: 'api', description: 'API Requests & Interceptors (Dio)', picked: false },
  { label: 'ai', description: 'AI Service', picked: false },
  { label: 'localization', description: 'Multi-language Support', picked: false },
  { label: 'startup', description: 'Startup Service', picked: false },
  { label: 'toast', description: 'Toast Notifications', picked: false },
  { label: 'testing', description: 'Testing Setup', picked: false },
  { label: 'cicd', description: 'CI/CD Pipeline', picked: false },
  { label: 'flavors', description: 'Build Flavors', picked: false },
];

export function registerCreateProjectCommand(
  context: vscode.ExtensionContext,
  sidebar: SidebarProvider
) {
  const command = vscode.commands.registerCommand('flutterforge.createProject', async () => {
    try {
      // Step 1: Project name
      const name = await vscode.window.showInputBox({
        prompt: 'Enter project name (lowercase, underscores only)',
        placeHolder: 'my_app',
        validateInput: (value) => {
          if (!value) {
            return 'Project name is required';
          }
          if (!/^[a-z][a-z0-9_]*$/.test(value)) {
            return 'Use only lowercase letters, numbers, and underscores';
          }
          return null;
        },
      });

      if (!name) {
        return;
      }

      // Step 2: Organization
      const org = await vscode.window.showInputBox({
        prompt: 'Enter organization identifier',
        placeHolder: 'com.example',
        value: 'com.example',
        validateInput: (value) => {
          if (!value) {
            return 'Organization is required';
          }
          if (!/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$/.test(value)) {
            return 'Use reverse domain notation (e.g. com.mycompany)';
          }
          return null;
        },
      });

      if (!org) {
        return;
      }

      // Step 3: Select modules
      const selected = await vscode.window.showQuickPick(AVAILABLE_MODULES, {
        canPickMany: true,
        placeHolder: 'Select modules to include',
        title: 'FlutterForge Modules',
      });

      if (!selected) {
        return;
      }

      const modules = ['mvvm', ...selected.map((s) => s.label)];

      // Step 4: Choose target directory
      const targetUri = await vscode.window.showOpenDialog({
        canSelectFolders: true,
        canSelectFiles: false,
        canSelectMany: false,
        openLabel: 'Select Parent Directory',
        title: 'Where to create the project',
      });

      if (!targetUri || targetUri.length === 0) {
        return;
      }

      const targetDir = targetUri[0].fsPath;

      // Step 5: Run FlutterForge
      const runner = new ForgeRunner();
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: `FlutterForge: Creating "${name}"...`,
          cancellable: false,
        },
        async () => {
          await runner.createProject(name, org, modules, targetDir);
        }
      );

      // Step 6: Open the new project
      const projectPath = vscode.Uri.file(`${targetDir}/${name}`);
      const openChoice = await vscode.window.showInformationMessage(
        `Project "${name}" created successfully!`,
        'Open Project',
        'Open in New Window'
      );

      if (openChoice === 'Open Project') {
        await vscode.commands.executeCommand('vscode.openFolder', projectPath);
      } else if (openChoice === 'Open in New Window') {
        await vscode.commands.executeCommand('vscode.openFolder', projectPath, true);
      }

      sidebar.refresh();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      vscode.window.showErrorMessage(`FlutterForge: ${message}`);
    }
  });

  context.subscriptions.push(command);
}
