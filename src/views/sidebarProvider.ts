import * as vscode from 'vscode';
import { getWorkspacePath, loadForgeConfig, getScreenNames } from '../utils/config';

type TreeItemType = 'header' | 'module' | 'screen' | 'platform' | 'info';

class ForgeTreeItem extends vscode.TreeItem {
  constructor(
    label: string,
    public readonly type: TreeItemType,
    collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None,
    public readonly children: ForgeTreeItem[] = []
  ) {
    super(label, collapsibleState);
    this.contextValue = type;

    switch (type) {
      case 'header':
        this.iconPath = new vscode.ThemeIcon('project');
        break;
      case 'module':
        this.iconPath = new vscode.ThemeIcon('extensions');
        break;
      case 'screen':
        this.iconPath = new vscode.ThemeIcon('window');
        break;
      case 'platform':
        this.iconPath = new vscode.ThemeIcon('device-mobile');
        break;
      case 'info':
        this.iconPath = new vscode.ThemeIcon('info');
        break;
    }
  }
}

export class SidebarProvider implements vscode.TreeDataProvider<ForgeTreeItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<ForgeTreeItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  constructor(private context: vscode.ExtensionContext) {}

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: ForgeTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ForgeTreeItem): ForgeTreeItem[] {
    if (element) {
      return element.children;
    }

    return this.buildTree();
  }

  private buildTree(): ForgeTreeItem[] {
    const workspacePath = getWorkspacePath();
    if (!workspacePath) {
      return [new ForgeTreeItem('No workspace open', 'info')];
    }

    const config = loadForgeConfig(workspacePath);
    if (!config) {
      return [
        new ForgeTreeItem('No FlutterForge project detected', 'info'),
        new ForgeTreeItem('Run "FlutterForge: Create Project" to start', 'info'),
      ];
    }

    const items: ForgeTreeItem[] = [];

    // Project name
    items.push(new ForgeTreeItem(config.appName, 'header'));

    // Org
    items.push(new ForgeTreeItem(`org: ${config.org}`, 'info'));

    // Modules
    const moduleItems = config.modules.map(
      (m) => new ForgeTreeItem(m, 'module')
    );
    items.push(
      new ForgeTreeItem(
        `Modules (${config.modules.length})`,
        'header',
        vscode.TreeItemCollapsibleState.Collapsed,
        moduleItems
      )
    );

    // Screens
    const screenNames = getScreenNames(workspacePath);
    const screenItems = screenNames.map((s) => {
      const item = new ForgeTreeItem(s, 'screen');
      item.command = {
        command: 'vscode.open',
        title: 'Open View',
        arguments: [
          vscode.Uri.file(`${workspacePath}/lib/features/${s}/views/${s}_view.dart`),
        ],
      };
      return item;
    });
    items.push(
      new ForgeTreeItem(
        `Screens (${screenNames.length})`,
        'header',
        vscode.TreeItemCollapsibleState.Expanded,
        screenItems
      )
    );

    // Platforms
    const platformItems = config.platforms.map(
      (p) => new ForgeTreeItem(p, 'platform')
    );
    items.push(
      new ForgeTreeItem(
        `Platforms (${config.platforms.length})`,
        'header',
        vscode.TreeItemCollapsibleState.Collapsed,
        platformItems
      )
    );

    return items;
  }
}
