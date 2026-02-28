import * as vscode from 'vscode';
import { execSync, spawn } from 'child_process';
import * as path from 'path';

export class MintRunner {
  private getCliPath(): string {
    const config = vscode.workspace.getConfiguration('fluttermint');
    const cliPath = config.get<string>('cliPath', '');

    if (!cliPath) {
      throw new Error(
        'FlutterMint CLI path not configured. Set "fluttermint.cliPath" in VS Code settings.'
      );
    }

    return cliPath;
  }

  private getEntryPoint(): string {
    const cliPath = this.getCliPath();
    return path.join(cliPath, 'bin', 'fluttermint.dart');
  }

  async createProject(
    name: string,
    org: string,
    modules: string[],
    targetDir: string
  ): Promise<string> {
    const args = ['run', this.getEntryPoint(), 'create', '--name', name, '--org', org];

    if (modules.length > 0) {
      args.push('--modules', modules.join(','));
    }

    return this.runDart(args, targetDir);
  }

  async addScreen(
    screenName: string,
    params: Map<string, string>,
    projectPath: string
  ): Promise<string> {
    const args = ['run', this.getEntryPoint(), 'screen', screenName];

    for (const [key, type] of params) {
      args.push('--param', `${key}:${type}`);
    }

    return this.runDart(args, projectPath);
  }

  async getStatus(projectPath: string): Promise<string> {
    const args = ['run', this.getEntryPoint(), 'status'];
    return this.runDart(args, projectPath);
  }

  private runDart(args: string[], cwd: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';

      const proc = spawn('dart', args, {
        cwd,
        shell: true,
      });

      proc.stdout.on('data', (data: Buffer) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      proc.on('close', (code: number | null) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(stderr || `Process exited with code ${code}`));
        }
      });

      proc.on('error', (err: Error) => {
        reject(new Error(`Failed to run dart: ${err.message}`));
      });
    });
  }
}
