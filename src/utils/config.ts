import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { parse as parseYaml } from 'yaml';

export interface ForgeConfig {
  appName: string;
  org: string;
  modules: string[];
  platforms: string[];
}

export function getWorkspacePath(): string | undefined {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    return undefined;
  }
  return folders[0].uri.fsPath;
}

export function loadForgeConfig(projectPath: string): ForgeConfig | null {
  const configPath = path.join(projectPath, '.flutterforge.yaml');

  if (!fs.existsSync(configPath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(configPath, 'utf-8');
    const yaml = parseYaml(content);

    if (!yaml || !yaml.app_name || !yaml.modules) {
      return null;
    }

    return {
      appName: yaml.app_name,
      org: yaml.org || 'com.example',
      modules: yaml.modules || [],
      platforms: yaml.platforms || ['android', 'ios'],
    };
  } catch {
    return null;
  }
}

export function getScreenNames(projectPath: string): string[] {
  const featuresDir = path.join(projectPath, 'lib', 'features');

  if (!fs.existsSync(featuresDir)) {
    return [];
  }

  try {
    return fs
      .readdirSync(featuresDir, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .filter((dirent) => dirent.name !== 'common')
      .map((dirent) => dirent.name);
  } catch {
    return [];
  }
}
