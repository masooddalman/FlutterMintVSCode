import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class EditorProvider {
  private static panel: vscode.WebviewPanel | undefined;

  static show(context: vscode.ExtensionContext) {
    if (EditorProvider.panel) {
      EditorProvider.panel.reveal();
      return;
    }

    EditorProvider.panel = vscode.window.createWebviewPanel(
      'flutterforgeEditor',
      'FlutterForge Editor',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(context.extensionPath, 'webview')),
        ],
      }
    );

    const htmlPath = path.join(context.extensionPath, 'webview', 'index.html');
    let html = fs.readFileSync(htmlPath, 'utf-8');

    // Set base path for webview resources
    const webviewUri = EditorProvider.panel.webview.asWebviewUri(
      vscode.Uri.file(path.join(context.extensionPath, 'webview'))
    );
    html = html.replace('{{webviewUri}}', webviewUri.toString());

    EditorProvider.panel.webview.html = html;

    // Handle messages from webview
    EditorProvider.panel.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case 'ready':
            console.log('FlutterForge editor webview ready');
            break;
        }
      },
      undefined,
      context.subscriptions
    );

    EditorProvider.panel.onDidDispose(() => {
      EditorProvider.panel = undefined;
    });
  }
}
