import * as vscode from 'vscode';
import { WizardConfig } from './wizardFields';
import { generateWizardHtml } from './wizardHtml';

export class WizardPanel {
  /**
   * Opens a wizard panel and returns form data when submitted.
   * Returns undefined if the user cancels or closes the panel.
   */
  static show<T extends Record<string, unknown>>(
    context: vscode.ExtensionContext,
    config: WizardConfig
  ): Promise<T | undefined> {
    return new Promise((resolve) => {
      const panel = vscode.window.createWebviewPanel(
        config.id,
        config.title,
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: false,
          localResourceRoots: [context.extensionUri],
        }
      );

      let resolved = false;

      const dispose = () => {
        if (!resolved) {
          resolved = true;
          resolve(undefined);
        }
      };

      panel.onDidDispose(dispose, undefined, context.subscriptions);

      panel.webview.onDidReceiveMessage(
        async (message) => {
          switch (message.type) {
            case 'submit': {
              resolved = true;
              panel.dispose();
              resolve(message.data as T);
              break;
            }
            case 'cancel': {
              resolved = true;
              panel.dispose();
              resolve(undefined);
              break;
            }
            case 'browseDirectory': {
              const uri = await vscode.window.showOpenDialog({
                canSelectFolders: true,
                canSelectFiles: false,
                canSelectMany: false,
                openLabel: 'Select Directory',
              });
              if (uri && uri.length > 0) {
                panel.webview.postMessage({
                  type: 'directorySelected',
                  fieldId: message.fieldId,
                  path: uri[0].fsPath,
                });
              }
              break;
            }
          }
        },
        undefined,
        context.subscriptions
      );

      panel.webview.html = generateWizardHtml(config);
    });
  }
}
