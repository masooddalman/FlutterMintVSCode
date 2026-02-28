import * as vscode from 'vscode';
import * as path from 'path';

export function getCliEntryPoint(): string {
  const config = vscode.workspace.getConfiguration('fluttermint');
  const cliPath = config.get<string>('cliPath', '');

  if (!cliPath) {
    throw new Error(
      'FlutterMint CLI path not configured. Set "fluttermint.cliPath" in VS Code settings.'
    );
  }

  return path.join(cliPath, 'bin', 'fluttermint.dart');
}

export function runInTerminal(name: string, args: string[], cwd: string): void {
  const entryPoint = getCliEntryPoint();
  const fullArgs = ['run', entryPoint, ...args];
  const command = `dart ${fullArgs.map(a => a.includes(' ') ? `"${a}"` : a).join(' ')}`;

  const terminal = vscode.window.createTerminal({ name: `FlutterMint: ${name}`, cwd });
  terminal.sendText(command);
  terminal.show();
}
