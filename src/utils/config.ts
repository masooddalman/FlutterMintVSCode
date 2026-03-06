import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { parse as parseYaml } from 'yaml';

export interface MintConfig {
  appName: string;
  org: string;
  modules: string[];
  platforms: string[];
  designPattern: string;
}

export function getWorkspacePath(): string | undefined {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    return undefined;
  }
  return folders[0].uri.fsPath;
}

export function loadMintConfig(projectPath: string): MintConfig | null {
  const configPath = path.join(projectPath, '.fluttermint.yaml');

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
      designPattern: yaml.design_pattern || 'mvvm',
    };
  } catch {
    return null;
  }
}

export interface DbTableInfo {
  name: string;
  columns: Array<{ name: string; type: string }>;
}

const SQL_TO_DART: Record<string, string> = {
  'TEXT': 'String',
  'INTEGER': 'int',
  'REAL': 'double',
};

export function getDbTables(projectPath: string): DbTableInfo[] {
  const dbPath = path.join(projectPath, 'lib', 'core', 'database', 'database_service.dart');
  if (!fs.existsSync(dbPath)) { return []; }

  try {
    const content = fs.readFileSync(dbPath, 'utf-8');
    const tables: DbTableInfo[] = [];
    const regex = /CREATE TABLE (\w+)\(id INTEGER PRIMARY KEY AUTOINCREMENT,\s*([^)]+)\)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      const tableName = match[1];
      const colDefs = match[2].split(',').map(c => c.trim()).filter(Boolean);
      const columns = colDefs.map(col => {
        const parts = col.split(/\s+/);
        return { name: parts[0], type: SQL_TO_DART[parts[1]] || parts[1] };
      });
      tables.push({ name: tableName, columns });
    }

    return tables;
  } catch {
    return [];
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
