import * as vscode from 'vscode';
import { EditorProvider } from '../views/editorProvider';

export function registerOpenEditorCommand(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand('fluttermint.openEditor', () => {
    EditorProvider.show(context);
  });

  context.subscriptions.push(command);
}
