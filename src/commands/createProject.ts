import * as vscode from 'vscode';
import { SidebarWebviewProvider } from '../views/sidebarWebviewProvider';
import { CreateProjectPanel } from '../views/createProjectPanel';

export function registerCreateProjectCommand(
  context: vscode.ExtensionContext,
  sidebar: SidebarWebviewProvider
) {
  const command = vscode.commands.registerCommand('flutterforge.createProject', () => {
    CreateProjectPanel.show(context, sidebar);
  });

  context.subscriptions.push(command);
}
