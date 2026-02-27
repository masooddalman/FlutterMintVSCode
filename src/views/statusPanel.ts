import * as vscode from 'vscode';
import { loadForgeConfig, getScreenNames } from '../utils/config';
import { AVAILABLE_MODULES, AVAILABLE_PLATFORMS, MODULE_DEPENDENCIES } from '../utils/constants';

export class StatusPanel {
  static show(projectPath: string): void {
    const config = loadForgeConfig(projectPath);
    if (!config) {
      vscode.window.showErrorMessage('No FlutterForge project found in this workspace.');
      return;
    }

    const screens = getScreenNames(projectPath);

    const installedModules = AVAILABLE_MODULES.filter(m => config.modules.includes(m.label));
    const availableModules = AVAILABLE_MODULES.filter(m => !config.modules.includes(m.label));

    const enabledPlatforms = AVAILABLE_PLATFORMS.filter(p => config.platforms.includes(p.label));
    const availablePlatforms = AVAILABLE_PLATFORMS.filter(p => !config.platforms.includes(p.label));

    const nonce = getNonce();

    const panel = vscode.window.createWebviewPanel(
      'flutterforge.status',
      'Project Status',
      vscode.ViewColumn.One,
      { enableScripts: true },
    );

    panel.webview.html = buildHtml(
      nonce,
      config.appName,
      config.org,
      installedModules,
      availableModules,
      enabledPlatforms,
      availablePlatforms,
      screens,
    );

    panel.webview.onDidReceiveMessage((msg) => {
      if (msg.type === 'close') { panel.dispose(); }
    });
  }
}

function buildHtml(
  nonce: string,
  appName: string,
  org: string,
  installedModules: { label: string; description: string }[],
  availableModules: { label: string; description: string }[],
  enabledPlatforms: { label: string; description: string }[],
  availablePlatforms: { label: string; description: string }[],
  screens: string[],
): string {
  const installedTags = installedModules.map(m =>
    `<span class="tag installed" title="${esc(m.description)}">${esc(m.label)}</span>`
  ).join('');

  const availableTags = availableModules.map(m => {
    const deps = MODULE_DEPENDENCIES[m.label];
    const depHint = deps ? ` (requires: ${deps.join(', ')})` : '';
    return `<span class="tag available" title="${esc(m.description + depHint)}">${esc(m.label)}</span>`;
  }).join('');

  const enabledPlatTags = enabledPlatforms.map(p =>
    `<span class="tag installed" title="${esc(p.description)}">${esc(p.label)}</span>`
  ).join('');

  const availablePlatTags = availablePlatforms.map(p =>
    `<span class="tag available" title="${esc(p.description)}">${esc(p.label)}</span>`
  ).join('');

  const screenTags = screens.length > 0
    ? screens.map(s => `<span class="tag screen">${esc(s)}</span>`).join('')
    : '<span class="muted">No screens yet</span>';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-editor-foreground);
      background: var(--vscode-editor-background);
      display: flex;
      justify-content: center;
      padding: 0;
    }

    .status {
      width: 100%;
      max-width: 600px;
      padding: 32px 24px;
    }

    .status-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 24px;
    }

    .project-header {
      padding: 16px;
      border-radius: 8px;
      background: color-mix(in srgb, var(--vscode-focusBorder) 8%, var(--vscode-editor-background));
      border: 1px solid color-mix(in srgb, var(--vscode-focusBorder) 25%, transparent);
      margin-bottom: 24px;
    }

    .project-name {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .project-org {
      font-size: 13px;
      color: var(--vscode-descriptionForeground);
    }

    .section {
      margin-bottom: 20px;
    }

    .section-title {
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .section-title .count {
      font-size: 11px;
      font-weight: 400;
      color: var(--vscode-descriptionForeground);
    }

    .tag-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .tag {
      display: inline-block;
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .tag.installed {
      background: color-mix(in srgb, var(--vscode-testing-iconPassed, #4caf50) 15%, var(--vscode-editor-background));
      border: 1px solid color-mix(in srgb, var(--vscode-testing-iconPassed, #4caf50) 30%, transparent);
      color: var(--vscode-editor-foreground);
    }

    .tag.available {
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.3));
      color: var(--vscode-descriptionForeground);
    }

    .tag.screen {
      background: color-mix(in srgb, var(--vscode-focusBorder) 12%, var(--vscode-editor-background));
      border: 1px solid color-mix(in srgb, var(--vscode-focusBorder) 25%, transparent);
      color: var(--vscode-editor-foreground);
    }

    .muted {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      font-style: italic;
    }

    .sub-label {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 6px;
    }

    .divider {
      height: 1px;
      background: var(--vscode-input-border, rgba(128,128,128,0.2));
      margin: 20px 0;
    }

    .actions {
      display: flex;
      justify-content: center;
      margin-top: 28px;
      padding-top: 16px;
      border-top: 1px solid var(--vscode-input-border, rgba(128,128,128,0.2));
    }

    .btn {
      padding: 9px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-family: var(--vscode-font-family);
      font-weight: 500;
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }

    .btn:hover { background: var(--vscode-button-secondaryHoverBackground); }
  </style>
</head>
<body>
  <div class="status">
    <h2 class="status-title">Project Status</h2>

    <div class="project-header">
      <div class="project-name">${esc(appName)}</div>
      <div class="project-org">${esc(org)}</div>
    </div>

    <div class="section">
      <div class="section-title">Installed Modules <span class="count">(${installedModules.length})</span></div>
      <div class="tag-grid">
        ${installedTags || '<span class="muted">None</span>'}
      </div>
    </div>

    ${availableModules.length > 0 ? `
    <div class="section">
      <div class="section-title">Available Modules <span class="count">(${availableModules.length})</span></div>
      <div class="tag-grid">
        ${availableTags}
      </div>
    </div>
    ` : ''}

    <div class="divider"></div>

    <div class="section">
      <div class="section-title">Enabled Platforms <span class="count">(${enabledPlatforms.length})</span></div>
      <div class="tag-grid">
        ${enabledPlatTags || '<span class="muted">None</span>'}
      </div>
    </div>

    ${availablePlatforms.length > 0 ? `
    <div class="section">
      <div class="section-title">Available Platforms <span class="count">(${availablePlatforms.length})</span></div>
      <div class="tag-grid">
        ${availablePlatTags}
      </div>
    </div>
    ` : ''}

    <div class="divider"></div>

    <div class="section">
      <div class="section-title">Screens <span class="count">(${screens.length})</span></div>
      <div class="tag-grid">
        ${screenTags}
      </div>
    </div>

    <div class="actions">
      <button class="btn" id="closeBtn">Close</button>
    </div>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();
    document.getElementById('closeBtn').addEventListener('click', () => {
      vscode.postMessage({ type: 'close' });
    });
  </script>
</body>
</html>`;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function getNonce(): string {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
