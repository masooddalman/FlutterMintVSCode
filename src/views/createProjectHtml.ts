import { AVAILABLE_MODULES } from '../utils/constants';

export function generateCreateProjectHtml(nonce: string): string {
  const defaultModules = AVAILABLE_MODULES.filter(m => m.picked);
  const optionalModules = AVAILABLE_MODULES.filter(m => !m.picked);

  const defaultTags = defaultModules
    .map(m => `<span class="tag">${esc(m.label)}</span>`)
    .join(' ');

  const optionalCards = optionalModules
    .map(m => `
      <div class="module-card" data-module="${esc(m.label)}">
        <input type="checkbox" name="module" value="${esc(m.label)}">
        <div class="card-body">
          <span class="card-title">${esc(m.label)}</span>
          <span class="card-desc">${esc(m.description)}</span>
        </div>
      </div>`)
    .join('');

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

    .wizard {
      width: 100%;
      max-width: 640px;
      padding: 32px 24px;
    }

    /* --- Step Header --- */
    .step-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 24px;
    }

    .step-dot {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
      border: 2px solid var(--vscode-input-border, rgba(128,128,128,0.4));
      color: var(--vscode-descriptionForeground);
      flex-shrink: 0;
    }

    .step-dot.active {
      border-color: var(--vscode-focusBorder);
      background: var(--vscode-focusBorder);
      color: var(--vscode-button-foreground);
    }

    .step-dot.done {
      border-color: var(--vscode-testing-iconPassed, #4caf50);
      background: var(--vscode-testing-iconPassed, #4caf50);
      color: #fff;
    }

    .step-line {
      flex: 1;
      height: 2px;
      background: var(--vscode-input-border, rgba(128,128,128,0.3));
    }

    .step-line.done {
      background: var(--vscode-testing-iconPassed, #4caf50);
    }

    .wizard-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 20px;
    }

    /* --- Steps visibility --- */
    .step { display: none; }
    .step.visible { display: block; }

    /* --- Form Fields --- */
    .field {
      margin-bottom: 18px;
    }

    .field-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 5px;
    }

    .field-label .req {
      color: var(--vscode-errorForeground, #f44);
    }

    .text-input {
      width: 100%;
      padding: 8px 10px;
      border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.4));
      border-radius: 4px;
      background: var(--vscode-input-background);
      color: var(--vscode-input-foreground);
      font-family: var(--vscode-font-family);
      font-size: 13px;
      outline: none;
      transition: border-color 0.15s;
    }

    .text-input::placeholder {
      color: var(--vscode-input-placeholderForeground);
    }

    .text-input:focus {
      border-color: var(--vscode-focusBorder);
    }

    .text-input.invalid {
      border-color: var(--vscode-errorForeground, #f44);
    }

    .field-error {
      font-size: 12px;
      color: var(--vscode-errorForeground, #f44);
      margin-top: 3px;
      min-height: 16px;
    }

    .dir-row {
      display: flex;
      gap: 8px;
    }

    .dir-row .text-input { flex: 1; }

    .browse-btn {
      padding: 8px 14px;
      border: none;
      border-radius: 4px;
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      cursor: pointer;
      font-size: 12px;
      font-family: var(--vscode-font-family);
      white-space: nowrap;
      transition: background 0.15s;
    }

    .browse-btn:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }

    /* --- Actions --- */
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
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
      transition: background 0.15s;
    }

    .btn-primary {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }

    .btn-primary:hover { background: var(--vscode-button-hoverBackground); }

    .btn-secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }

    .btn-secondary:hover { background: var(--vscode-button-secondaryHoverBackground); }

    /* --- Step 2: Module Grid --- */
    .defaults-info {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 12px;
    }

    .tag {
      display: inline-block;
      padding: 2px 8px;
      margin: 2px 2px;
      border-radius: 3px;
      font-size: 11px;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
    }

    .module-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .module-card {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 12px 14px;
      border-radius: 6px;
      border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.3));
      background: var(--vscode-input-background);
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      user-select: none;
    }

    .module-card:hover {
      border-color: var(--vscode-focusBorder);
    }

    .module-card.selected {
      border-color: var(--vscode-focusBorder);
      background: color-mix(in srgb, var(--vscode-focusBorder) 12%, var(--vscode-input-background));
    }

    .module-card input[type="checkbox"] {
      margin-top: 2px;
      flex-shrink: 0;
      accent-color: var(--vscode-button-background);
    }

    .card-body { flex: 1; min-width: 0; }

    .card-title {
      display: block;
      font-weight: 600;
      font-size: 13px;
    }

    .card-desc {
      display: block;
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      margin-top: 2px;
    }

    /* --- Step 3: Progress --- */
    .progress-section {
      margin-bottom: 16px;
    }

    .progress-label {
      font-size: 13px;
      margin-bottom: 8px;
      color: var(--vscode-descriptionForeground);
    }

    .progress-bar-bg {
      width: 100%;
      height: 6px;
      border-radius: 3px;
      background: var(--vscode-input-border, rgba(128,128,128,0.3));
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      width: 0%;
      border-radius: 3px;
      background: var(--vscode-progressBar-background, #0078d4);
      transition: width 0.4s ease;
    }

    .log-area {
      width: 100%;
      height: 320px;
      overflow-y: auto;
      padding: 12px;
      border-radius: 4px;
      background: var(--vscode-terminal-background, #1e1e1e);
      color: var(--vscode-terminal-foreground, #cccccc);
      font-family: var(--vscode-editor-font-family, 'Consolas', monospace);
      font-size: 12px;
      line-height: 1.5;
      white-space: pre-wrap;
      word-break: break-all;
      margin-top: 12px;
    }

    /* --- Step 4: Finish --- */
    .finish-icon {
      font-size: 48px;
      text-align: center;
      margin-bottom: 16px;
      color: var(--vscode-testing-iconPassed, #4caf50);
    }

    .finish-title {
      font-size: 20px;
      font-weight: 600;
      text-align: center;
      margin-bottom: 8px;
    }

    .finish-sub {
      text-align: center;
      color: var(--vscode-descriptionForeground);
      font-size: 13px;
      margin-bottom: 24px;
    }

    .finish-actions {
      display: flex;
      justify-content: center;
      gap: 10px;
    }

    .error-msg {
      color: var(--vscode-errorForeground, #f44);
      text-align: center;
      margin-bottom: 12px;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="wizard">

    <!-- Step Indicator -->
    <div class="step-indicator">
      <div class="step-dot active" id="dot-1">1</div>
      <div class="step-line" id="line-1"></div>
      <div class="step-dot" id="dot-2">2</div>
      <div class="step-line" id="line-2"></div>
      <div class="step-dot" id="dot-3">3</div>
      <div class="step-line" id="line-3"></div>
      <div class="step-dot" id="dot-4">4</div>
    </div>

    <!-- STEP 1: Project Info -->
    <div class="step visible" id="step-1">
      <h2 class="wizard-title">Create Project</h2>

      <div class="field">
        <label class="field-label" for="appName">App Name <span class="req">*</span></label>
        <input type="text" class="text-input" id="appName" placeholder="my_app">
        <div class="field-error" id="err-appName"></div>
      </div>

      <div class="field">
        <label class="field-label" for="orgName">Organization <span class="req">*</span></label>
        <input type="text" class="text-input" id="orgName" placeholder="com.example" value="com.example">
        <div class="field-error" id="err-orgName"></div>
      </div>

      <div class="field">
        <label class="field-label" for="targetDir">Target Directory <span class="req">*</span></label>
        <div class="dir-row">
          <input type="text" class="text-input" id="targetDir" placeholder="Select directory..." readonly>
          <button type="button" class="browse-btn" id="browseBtn">Browse...</button>
        </div>
        <div class="field-error" id="err-targetDir"></div>
      </div>

      <div class="actions">
        <button type="button" class="btn btn-secondary" id="quickCreateBtn">Create Project</button>
        <button type="button" class="btn btn-primary" id="nextToStep2Btn">Next</button>
      </div>
    </div>

    <!-- STEP 2: Module Selection -->
    <div class="step" id="step-2">
      <h2 class="wizard-title">Select Modules</h2>

      <div class="defaults-info">
        Always included: ${defaultTags}
      </div>

      <div class="module-grid">
        ${optionalCards}
      </div>

      <div class="actions">
        <button type="button" class="btn btn-secondary" id="backToStep1Btn">Back</button>
        <button type="button" class="btn btn-primary" id="fullCreateBtn">Create</button>
      </div>
    </div>

    <!-- STEP 3: Progress -->
    <div class="step" id="step-3">
      <h2 class="wizard-title">Creating Project...</h2>

      <div class="progress-section">
        <div class="progress-label" id="progressLabel">Starting...</div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" id="progressBar"></div>
        </div>
      </div>

      <div class="log-area" id="logArea"></div>
    </div>

    <!-- STEP 4: Finish -->
    <div class="step" id="step-4">
      <div class="finish-icon" id="finishIcon">&#10003;</div>
      <div class="finish-title" id="finishTitle">Project Created!</div>
      <div class="finish-sub" id="finishSub"></div>
      <div class="error-msg" id="errorMsg" style="display:none;"></div>
      <div class="finish-actions">
        <button type="button" class="btn btn-secondary" id="openProjectBtn">Open Project</button>
        <button type="button" class="btn btn-primary" id="openNewWindowBtn">Open in New Window</button>
      </div>
    </div>

  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();

    // --- Elements ---
    const steps = [
      document.getElementById('step-1'),
      document.getElementById('step-2'),
      document.getElementById('step-3'),
      document.getElementById('step-4'),
    ];
    const dots = [
      document.getElementById('dot-1'),
      document.getElementById('dot-2'),
      document.getElementById('dot-3'),
      document.getElementById('dot-4'),
    ];
    const lines = [
      document.getElementById('line-1'),
      document.getElementById('line-2'),
      document.getElementById('line-3'),
    ];

    let currentStep = 0;

    function goToStep(n) {
      steps.forEach((s, i) => s.classList.toggle('visible', i === n));
      dots.forEach((d, i) => {
        d.classList.remove('active', 'done');
        if (i < n) d.classList.add('done');
        else if (i === n) d.classList.add('active');
      });
      lines.forEach((l, i) => {
        l.classList.toggle('done', i < n);
      });
      currentStep = n;
    }

    // --- Validation ---
    function validateStep1() {
      let ok = true;
      const name = document.getElementById('appName').value.trim();
      const org = document.getElementById('orgName').value.trim();
      const dir = document.getElementById('targetDir').value.trim();

      document.getElementById('err-appName').textContent = '';
      document.getElementById('err-orgName').textContent = '';
      document.getElementById('err-targetDir').textContent = '';
      document.getElementById('appName').classList.remove('invalid');
      document.getElementById('orgName').classList.remove('invalid');
      document.getElementById('targetDir').classList.remove('invalid');

      if (!name) {
        document.getElementById('err-appName').textContent = 'App name is required';
        document.getElementById('appName').classList.add('invalid');
        ok = false;
      } else if (!/^[a-z][a-z0-9_]*$/.test(name)) {
        document.getElementById('err-appName').textContent = 'Use only lowercase letters, numbers, and underscores';
        document.getElementById('appName').classList.add('invalid');
        ok = false;
      }

      if (!org) {
        document.getElementById('err-orgName').textContent = 'Organization is required';
        document.getElementById('orgName').classList.add('invalid');
        ok = false;
      } else if (!/^[a-z][a-z0-9]*(\\.[a-z][a-z0-9]*)+$/.test(org)) {
        document.getElementById('err-orgName').textContent = 'Use reverse domain notation (e.g. com.mycompany)';
        document.getElementById('orgName').classList.add('invalid');
        ok = false;
      }

      if (!dir) {
        document.getElementById('err-targetDir').textContent = 'Target directory is required';
        document.getElementById('targetDir').classList.add('invalid');
        ok = false;
      }

      return ok;
    }

    // --- Browse ---
    document.getElementById('browseBtn').addEventListener('click', () => {
      vscode.postMessage({ type: 'browseDirectory' });
    });

    // --- Quick Create ---
    document.getElementById('quickCreateBtn').addEventListener('click', () => {
      if (!validateStep1()) return;
      goToStep(2);
      vscode.postMessage({
        type: 'quickCreate',
        name: document.getElementById('appName').value.trim(),
        targetDir: document.getElementById('targetDir').value.trim(),
      });
    });

    // --- Next to Step 2 ---
    document.getElementById('nextToStep2Btn').addEventListener('click', () => {
      if (!validateStep1()) return;
      goToStep(1);
    });

    // --- Back to Step 1 ---
    document.getElementById('backToStep1Btn').addEventListener('click', () => {
      goToStep(0);
    });

    // --- Module card toggle ---
    document.querySelectorAll('.module-card').forEach(card => {
      const cb = card.querySelector('input[type="checkbox"]');
      card.addEventListener('click', (e) => {
        if (e.target === cb) return;
        cb.checked = !cb.checked;
        card.classList.toggle('selected', cb.checked);
      });
      cb.addEventListener('change', () => {
        card.classList.toggle('selected', cb.checked);
      });
    });

    // --- Full Create ---
    document.getElementById('fullCreateBtn').addEventListener('click', () => {
      const selected = Array.from(document.querySelectorAll('.module-card input:checked'))
        .map(cb => cb.value);
      goToStep(2);
      vscode.postMessage({
        type: 'fullCreate',
        name: document.getElementById('appName').value.trim(),
        org: document.getElementById('orgName').value.trim(),
        targetDir: document.getElementById('targetDir').value.trim(),
        modules: selected,
      });
    });

    // --- Open Project ---
    document.getElementById('openProjectBtn').addEventListener('click', () => {
      vscode.postMessage({ type: 'openProject' });
    });

    document.getElementById('openNewWindowBtn').addEventListener('click', () => {
      vscode.postMessage({ type: 'openProjectNewWindow' });
    });

    // --- Messages from extension ---
    window.addEventListener('message', event => {
      const msg = event.data;

      switch (msg.type) {
        case 'directorySelected':
          document.getElementById('targetDir').value = msg.path;
          document.getElementById('targetDir').classList.remove('invalid');
          document.getElementById('err-targetDir').textContent = '';
          break;

        case 'output': {
          const log = document.getElementById('logArea');
          log.textContent += msg.text;
          log.scrollTop = log.scrollHeight;
          break;
        }

        case 'progress': {
          const pct = Math.round((msg.step / msg.total) * 100);
          document.getElementById('progressBar').style.width = pct + '%';
          document.getElementById('progressLabel').textContent = 'Step ' + msg.step + ' of ' + msg.total + '...';
          break;
        }

        case 'complete':
          goToStep(3);
          document.getElementById('finishTitle').textContent = 'Project Created!';
          document.getElementById('finishSub').textContent = '"' + msg.name + '" is ready.';
          break;

        case 'error':
          goToStep(3);
          document.getElementById('finishIcon').textContent = '\\u2717';
          document.getElementById('finishIcon').style.color = 'var(--vscode-errorForeground, #f44)';
          document.getElementById('finishTitle').textContent = 'Creation Failed';
          document.getElementById('finishSub').style.display = 'none';
          document.getElementById('errorMsg').style.display = 'block';
          document.getElementById('errorMsg').textContent = msg.message;
          document.getElementById('openProjectBtn').style.display = 'none';
          document.getElementById('openNewWindowBtn').style.display = 'none';
          break;
      }
    });
  </script>
</body>
</html>`;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
