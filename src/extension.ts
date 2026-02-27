import * as vscode from 'vscode';
import { SidebarWebviewProvider } from './views/sidebarWebviewProvider';
import { registerCreateProjectCommand } from './commands/createProject';
import { registerAddScreenCommand } from './commands/addScreen';
import { registerOpenEditorCommand } from './commands/openEditor';
import { registerStatusCommand } from './commands/status';
import { registerAddModuleCommand } from './commands/addModule';
import { registerRemoveModuleCommand } from './commands/removeModule';
import { registerConfigModuleCommand } from './commands/configModule';
import { registerRunCommand } from './commands/run';
import { registerBuildCommand } from './commands/build';
import { registerAddPlatformCommand } from './commands/addPlatform';
import { registerRemovePlatformCommand } from './commands/removePlatform';
import { registerToggleHttpCommand } from './commands/toggleHttp';

export function activate(context: vscode.ExtensionContext) {
  console.log('FlutterForge extension activated');

  // Register webview sidebar
  const sidebarProvider = new SidebarWebviewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      SidebarWebviewProvider.viewType,
      sidebarProvider
    )
  );

  // Register commands
  registerCreateProjectCommand(context, sidebarProvider);
  registerAddScreenCommand(context, sidebarProvider);
  registerOpenEditorCommand(context);
  registerStatusCommand(context);
  registerAddModuleCommand(context, sidebarProvider);
  registerRemoveModuleCommand(context, sidebarProvider);
  registerConfigModuleCommand(context, sidebarProvider);
  registerRunCommand(context);
  registerBuildCommand(context);
  registerAddPlatformCommand(context, sidebarProvider);
  registerRemovePlatformCommand(context, sidebarProvider);
  registerToggleHttpCommand(context);

  // Watch for .flutterforge.yaml changes to refresh sidebar
  const watcher = vscode.workspace.createFileSystemWatcher('**/.flutterforge.yaml');
  watcher.onDidChange(() => sidebarProvider.refresh());
  watcher.onDidCreate(() => sidebarProvider.refresh());
  watcher.onDidDelete(() => sidebarProvider.refresh());
  context.subscriptions.push(watcher);
}

export function deactivate() {}
