import * as vscode from 'vscode';
import { registerCreateProjectCommand } from './commands/createProject';
import { registerAddScreenCommand } from './commands/addScreen';
import { registerOpenEditorCommand } from './commands/openEditor';
import { SidebarProvider } from './views/sidebarProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('FlutterForge extension activated');

  // Register sidebar
  const sidebarProvider = new SidebarProvider(context);
  vscode.window.registerTreeDataProvider('flutterforge.projectView', sidebarProvider);

  // Register commands
  registerCreateProjectCommand(context, sidebarProvider);
  registerAddScreenCommand(context, sidebarProvider);
  registerOpenEditorCommand(context);

  // Watch for .flutterforge.yaml changes to refresh sidebar
  const watcher = vscode.workspace.createFileSystemWatcher('**/.flutterforge.yaml');
  watcher.onDidChange(() => sidebarProvider.refresh());
  watcher.onDidCreate(() => sidebarProvider.refresh());
  watcher.onDidDelete(() => sidebarProvider.refresh());
  context.subscriptions.push(watcher);
}

export function deactivate() {}
