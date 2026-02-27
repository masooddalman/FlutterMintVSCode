import * as vscode from 'vscode';
import { getWorkspacePath, loadForgeConfig, getScreenNames } from '../utils/config';
import { CONFIGURABLE_MODULES } from '../utils/constants';

export class SidebarWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'flutterforge.sidebarView';

  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlContent();

    webviewView.webview.onDidReceiveMessage((message) => {
      if (message.command) {
        vscode.commands.executeCommand(message.command);
      }
    });
  }

  public refresh(): void {
    if (this._view) {
      this._view.webview.html = this._getHtmlContent();
    }
  }

  private _hasProject(): boolean {
    const workspacePath = getWorkspacePath();
    if (!workspacePath) { return false; }
    return loadForgeConfig(workspacePath) !== null;
  }

  private _hasConfigurableModule(): boolean {
    const workspacePath = getWorkspacePath();
    if (!workspacePath) { return false; }
    const config = loadForgeConfig(workspacePath);
    if (!config) { return false; }
    return CONFIGURABLE_MODULES.some(m => config.modules.includes(m.label));
  }

  private _getHtmlContent(): string {
    const nonce = this._getNonce();
    const projectInfoHtml = this._buildProjectInfoHtml();
    const hasProject = this._hasProject();
    const d = hasProject ? '' : ' disabled';
    const dc = hasProject && this._hasConfigurableModule() ? '' : ' disabled';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      padding: 12px 10px;
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: transparent;
      margin: 0;
    }
    .section {
      margin-bottom: 14px;
    }
    .section-header {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--vscode-sideBarSectionHeader-foreground);
      margin-bottom: 6px;
      padding-bottom: 4px;
      border-bottom: 1px solid var(--vscode-sideBarSectionHeader-border, rgba(128,128,128,0.2));
    }
    .btn-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px;
    }
    .btn-grid.single {
      grid-template-columns: 1fr;
    }
    .menu-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 10px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      font-family: var(--vscode-font-family);
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      text-align: left;
      transition: background 0.15s;
    }
    .menu-btn:hover:not(:disabled) {
      background: var(--vscode-button-secondaryHoverBackground);
    }
    .menu-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    .menu-btn.primary {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    .menu-btn.primary:hover:not(:disabled) {
      background: var(--vscode-button-hoverBackground);
    }
    .menu-btn .icon {
      font-size: 14px;
      flex-shrink: 0;
      width: 16px;
      text-align: center;
    }
    .divider {
      height: 1px;
      background: var(--vscode-sideBarSectionHeader-border, rgba(128,128,128,0.2));
      margin: 14px 0;
    }
    .project-info {
      padding: 10px;
      border-radius: 4px;
      background: var(--vscode-editor-background);
      font-size: 12px;
    }
    .project-info .label {
      color: var(--vscode-descriptionForeground);
      font-size: 11px;
      margin-top: 8px;
    }
    .project-info .label:first-child {
      margin-top: 0;
    }
    .project-info .value {
      margin-top: 2px;
      margin-bottom: 4px;
    }
    .tag {
      display: inline-block;
      padding: 2px 6px;
      margin: 2px 2px 2px 0;
      border-radius: 3px;
      font-size: 11px;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
    }
    .no-project {
      text-align: center;
      padding: 16px 10px;
      color: var(--vscode-descriptionForeground);
      font-size: 12px;
      line-height: 1.5;
    }
  </style>
</head>
<body>

  <div class="section">
    <div class="section-header">Project</div>
    <div class="btn-grid">
      <button class="menu-btn primary" data-cmd="flutterforge.createProject">
        <span class="icon">+</span> Create
      </button>
      <button class="menu-btn" data-cmd="flutterforge.status"${d}>
        <span class="icon">i</span> Status
      </button>
    </div>
  </div>

  <div class="section">
    <div class="section-header">Screens</div>
    <div class="btn-grid single">
      <button class="menu-btn" data-cmd="flutterforge.addScreen"${d}>
        <span class="icon">+</span> Add Screen
      </button>
    </div>
  </div>

  <div class="section">
    <div class="section-header">Modules</div>
    <div class="btn-grid">
      <button class="menu-btn" data-cmd="flutterforge.addModule"${d}>
        <span class="icon">+</span> Add
      </button>
      <button class="menu-btn" data-cmd="flutterforge.removeModule"${d}>
        <span class="icon">&minus;</span> Remove
      </button>
    </div>
    <div class="btn-grid single" style="margin-top:4px;">
      <button class="menu-btn" data-cmd="flutterforge.configModule"${dc}>
        <span class="icon">&#9881;</span> Configure
      </button>
    </div>
  </div>

  <div class="section">
    <div class="section-header">Run &amp; Build</div>
    <div class="btn-grid">
      <button class="menu-btn primary" data-cmd="flutterforge.run"${d}>
        <span class="icon">&#9654;</span> Run
      </button>
      <button class="menu-btn" data-cmd="flutterforge.build"${d}>
        <span class="icon">&#9634;</span> Build
      </button>
    </div>
  </div>

  <div class="section">
    <div class="section-header">Platform</div>
    <div class="btn-grid">
      <button class="menu-btn" data-cmd="flutterforge.addPlatform"${d}>
        <span class="icon">+</span> Add
      </button>
      <button class="menu-btn" data-cmd="flutterforge.removePlatform"${d}>
        <span class="icon">&minus;</span> Remove
      </button>
    </div>
  </div>

  <div class="section">
    <div class="section-header">Network</div>
    <div class="btn-grid single">
      <button class="menu-btn" data-cmd="flutterforge.toggleHttp"${d}>
        <span class="icon">&#9741;</span> Toggle HTTP
      </button>
    </div>
  </div>

  <div class="divider"></div>

  ${projectInfoHtml}

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    document.querySelectorAll('[data-cmd]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!btn.disabled) {
          vscode.postMessage({ command: btn.getAttribute('data-cmd') });
        }
      });
    });
  </script>
</body>
</html>`;
  }

  private _buildProjectInfoHtml(): string {
    const workspacePath = getWorkspacePath();
    if (!workspacePath) {
      return '<div class="no-project">No workspace open</div>';
    }

    const config = loadForgeConfig(workspacePath);
    if (!config) {
      return '<div class="no-project">No FlutterForge project detected.<br>Run <strong>Create</strong> to start.</div>';
    }

    const screens = getScreenNames(workspacePath);
    const moduleTags = config.modules.map(m => `<span class="tag">${m}</span>`).join(' ');
    const screenTags = screens.length > 0
      ? screens.map(s => `<span class="tag">${s}</span>`).join(' ')
      : '<span style="color:var(--vscode-descriptionForeground)">none</span>';
    const platformTags = config.platforms.map(p => `<span class="tag">${p}</span>`).join(' ');

    return `<div class="project-info">
      <div class="label">Project</div>
      <div class="value"><strong>${config.appName}</strong></div>
      <div class="label">Organization</div>
      <div class="value">${config.org}</div>
      <div class="label">Modules (${config.modules.length})</div>
      <div class="value">${moduleTags}</div>
      <div class="label">Screens (${screens.length})</div>
      <div class="value">${screenTags}</div>
      <div class="label">Platforms (${config.platforms.length})</div>
      <div class="value">${platformTags}</div>
    </div>`;
  }

  private _getNonce(): string {
    let text = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      text += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return text;
  }
}
