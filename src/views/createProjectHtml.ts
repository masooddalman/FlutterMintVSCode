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
      max-width: 680px;
      padding: 32px 24px;
    }

    /* --- Step Indicator --- */
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
    .field { margin-bottom: 18px; }

    .field-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 5px;
    }

    .field-label .req { color: var(--vscode-errorForeground, #f44); }

    .field-hint {
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 5px;
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

    .text-input::placeholder { color: var(--vscode-input-placeholderForeground); }
    .text-input:focus { border-color: var(--vscode-focusBorder); }
    .text-input.invalid { border-color: var(--vscode-errorForeground, #f44); }

    .field-error {
      font-size: 12px;
      color: var(--vscode-errorForeground, #f44);
      margin-top: 3px;
      min-height: 16px;
    }

    .dir-row { display: flex; gap: 8px; }
    .dir-row .text-input { flex: 1; }

    .browse-btn,
    .btn-small {
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

    .browse-btn:hover,
    .btn-small:hover { background: var(--vscode-button-secondaryHoverBackground); }

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

    .btn-primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
    .btn-primary:hover { background: var(--vscode-button-hoverBackground); }
    .btn-secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
    .btn-secondary:hover { background: var(--vscode-button-secondaryHoverBackground); }

    /* --- Tags --- */
    .tag {
      display: inline-block;
      padding: 2px 8px;
      margin: 2px;
      border-radius: 3px;
      font-size: 11px;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
    }

    .defaults-info {
      font-size: 12px;
      color: var(--vscode-descriptionForeground);
      margin-bottom: 12px;
    }

    /* --- Module Grid --- */
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

    .module-card:hover { border-color: var(--vscode-focusBorder); }

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
    .card-title { display: block; font-weight: 600; font-size: 13px; }
    .card-desc { display: block; font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 2px; }

    /* --- Flavors: Env Sections --- */
    .env-sections { margin-top: 16px; }

    .env-section {
      border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.3));
      border-radius: 6px;
      padding: 14px;
      margin-bottom: 12px;
    }

    .env-section-title {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--vscode-input-border, rgba(128,128,128,0.2));
    }

    .env-section .field { margin-bottom: 12px; }
    .env-section .field:last-child { margin-bottom: 0; }

    .default-env-radios {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 4px;
    }

    .default-env-radios label {
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      font-size: 13px;
    }

    .default-env-radios input[type="radio"] {
      accent-color: var(--vscode-button-background);
    }

    /* --- CI/CD: Checkboxes --- */
    .cicd-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .cicd-option {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 6px;
      border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.3));
      background: var(--vscode-input-background);
      cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
      user-select: none;
    }

    .cicd-option:hover { border-color: var(--vscode-focusBorder); }

    .cicd-option.selected {
      border-color: var(--vscode-focusBorder);
      background: color-mix(in srgb, var(--vscode-focusBorder) 12%, var(--vscode-input-background));
    }

    .cicd-option input[type="checkbox"] {
      margin-top: 2px;
      flex-shrink: 0;
      accent-color: var(--vscode-button-background);
    }

    /* --- Progress --- */
    .progress-section { margin-bottom: 16px; }

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

    /* --- Finish --- */
    .finish-icon {
      font-size: 48px;
      text-align: center;
      margin-bottom: 16px;
      color: var(--vscode-testing-iconPassed, #4caf50);
    }

    .finish-title { font-size: 20px; font-weight: 600; text-align: center; margin-bottom: 8px; }
    .finish-sub { text-align: center; color: var(--vscode-descriptionForeground); font-size: 13px; margin-bottom: 24px; }
    .finish-actions { display: flex; justify-content: center; gap: 10px; }

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

    <!-- Dynamic Step Indicator (rebuilt by JS) -->
    <div class="step-indicator" id="stepIndicator"></div>

    <!-- STEP: Project Info -->
    <div class="step visible" id="step-info">
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
        <button type="button" class="btn btn-primary" id="nextToModulesBtn">Next</button>
      </div>
    </div>

    <!-- STEP: Module Selection -->
    <div class="step" id="step-modules">
      <h2 class="wizard-title">Select Modules</h2>
      <div class="defaults-info">
        Always included: ${defaultTags}
      </div>
      <div class="module-grid">
        ${optionalCards}
      </div>
      <div class="actions">
        <button type="button" class="btn btn-secondary" id="backToInfoBtn">Back</button>
        <button type="button" class="btn btn-primary" id="modulesNextBtn">Create</button>
      </div>
    </div>

    <!-- STEP: Flavors Config -->
    <div class="step" id="step-flavors">
      <h2 class="wizard-title">Configure Flavors</h2>
      <div class="field">
        <label class="field-label" for="envNames">Environment Names <span class="req">*</span></label>
        <div class="field-hint">Comma-separated, lowercase (e.g. dev, staging, production)</div>
        <input type="text" class="text-input" id="envNames" value="dev, staging, production">
        <div class="field-error" id="err-envNames"></div>
      </div>
      <div class="env-sections" id="envSections"></div>
      <div class="field">
        <label class="field-label">Default Environment <span class="req">*</span></label>
        <div class="default-env-radios" id="defaultEnvRadios"></div>
        <div class="field-error" id="err-defaultEnv"></div>
      </div>
      <div class="actions">
        <button type="button" class="btn btn-secondary" id="flavorsBackBtn">Back</button>
        <button type="button" class="btn btn-primary" id="flavorsNextBtn">Next</button>
      </div>
    </div>

    <!-- STEP: CI/CD Config -->
    <div class="step" id="step-cicd">
      <h2 class="wizard-title">Configure CI/CD</h2>
      <div class="field">
        <label class="field-label">Pipeline Steps</label>
        <div class="cicd-grid">
          <div class="cicd-option" data-step="1">
            <input type="checkbox" name="cicdStep" value="1" checked>
            <div class="card-body">
              <span class="card-title">Format Check</span>
              <span class="card-desc">dart format --set-exit-if-changed</span>
            </div>
          </div>
          <div class="cicd-option selected" data-step="2">
            <input type="checkbox" name="cicdStep" value="2" checked>
            <div class="card-body">
              <span class="card-title">Caching</span>
              <span class="card-desc">Cache Flutter SDK &amp; pub deps</span>
            </div>
          </div>
          <div class="cicd-option" data-step="3">
            <input type="checkbox" name="cicdStep" value="3">
            <div class="card-body">
              <span class="card-title">Code Coverage</span>
              <span class="card-desc">Upload to Codecov</span>
            </div>
          </div>
          <div class="cicd-option selected" data-step="4">
            <input type="checkbox" name="cicdStep" value="4" checked>
            <div class="card-body">
              <span class="card-title">Concurrency Control</span>
              <span class="card-desc">Cancel in-progress CI runs</span>
            </div>
          </div>
          <div class="cicd-option" data-step="5">
            <input type="checkbox" name="cicdStep" value="5">
            <div class="card-body">
              <span class="card-title">Build Platforms</span>
              <span class="card-desc">APK, AAB, Web, iOS</span>
            </div>
          </div>
          <div class="cicd-option" data-step="6">
            <input type="checkbox" name="cicdStep" value="6">
            <div class="card-body">
              <span class="card-title">Firebase Distribution</span>
              <span class="card-desc">Push builds to Firebase</span>
            </div>
          </div>
          <div class="cicd-option" data-step="7">
            <input type="checkbox" name="cicdStep" value="7">
            <div class="card-body">
              <span class="card-title">Google Play Upload</span>
              <span class="card-desc">Push to Google Play</span>
            </div>
          </div>
          <div class="cicd-option" data-step="8">
            <input type="checkbox" name="cicdStep" value="8">
            <div class="card-body">
              <span class="card-title">TestFlight Upload</span>
              <span class="card-desc">Push to TestFlight (iOS)</span>
            </div>
          </div>
        </div>
      </div>
      <div class="field">
        <label class="field-label" for="cicdBranches">Additional Branches</label>
        <div class="field-hint">Comma-separated. "main" is always included.</div>
        <input type="text" class="text-input" id="cicdBranches" placeholder="develop, staging">
      </div>
      <div class="field">
        <label class="field-label">Build Platforms</label>
        <div class="field-hint">Platforms to build for each branch</div>
        <div class="cicd-grid">
          <div class="cicd-option selected" data-platform="1">
            <input type="checkbox" name="cicdPlatform" value="1" checked>
            <div class="card-body">
              <span class="card-title">Android APK</span>
              <span class="card-desc">Debug APK build</span>
            </div>
          </div>
          <div class="cicd-option" data-platform="2">
            <input type="checkbox" name="cicdPlatform" value="2">
            <div class="card-body">
              <span class="card-title">Android AAB</span>
              <span class="card-desc">Release App Bundle</span>
            </div>
          </div>
          <div class="cicd-option" data-platform="3">
            <input type="checkbox" name="cicdPlatform" value="3">
            <div class="card-body">
              <span class="card-title">Web</span>
              <span class="card-desc">Web build</span>
            </div>
          </div>
          <div class="cicd-option" data-platform="4">
            <input type="checkbox" name="cicdPlatform" value="4">
            <div class="card-body">
              <span class="card-title">iOS</span>
              <span class="card-desc">iOS build</span>
            </div>
          </div>
        </div>
      </div>
      <div class="actions">
        <button type="button" class="btn btn-secondary" id="cicdBackBtn">Back</button>
        <button type="button" class="btn btn-primary" id="cicdNextBtn">Create</button>
      </div>
    </div>

    <!-- STEP: Progress -->
    <div class="step" id="step-progress">
      <h2 class="wizard-title">Creating Project...</h2>
      <div class="progress-section">
        <div class="progress-label" id="progressLabel">Starting...</div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill" id="progressBar"></div>
        </div>
      </div>
      <div class="log-area" id="logArea"></div>
    </div>

    <!-- STEP: Finish -->
    <div class="step" id="step-finish">
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

    // ========================================
    // Dynamic step sequence
    // ========================================
    const ALL_STEPS = ['info', 'modules', 'flavors', 'cicd', 'progress', 'finish'];
    let stepSeq = ['info', 'modules', 'progress', 'finish'];
    let currentIdx = 0;

    function isFlavorsSelected() {
      const cb = document.querySelector('.module-card[data-module="flavors"] input');
      return cb && cb.checked;
    }

    function isCicdSelected() {
      const cb = document.querySelector('.module-card[data-module="cicd"] input');
      return cb && cb.checked;
    }

    function rebuildStepSeq() {
      const seq = ['info', 'modules'];
      if (isFlavorsSelected()) seq.push('flavors');
      if (isCicdSelected()) seq.push('cicd');
      seq.push('progress', 'finish');
      stepSeq = seq;
      renderIndicator();
    }

    function renderIndicator() {
      const container = document.getElementById('stepIndicator');
      container.innerHTML = '';
      stepSeq.forEach((id, i) => {
        if (i > 0) {
          const line = document.createElement('div');
          line.className = 'step-line' + (i <= currentIdx ? ' done' : '');
          line.id = 'line-' + i;
          container.appendChild(line);
        }
        const dot = document.createElement('div');
        dot.className = 'step-dot';
        if (i < currentIdx) dot.classList.add('done');
        else if (i === currentIdx) dot.classList.add('active');
        dot.textContent = String(i + 1);
        dot.id = 'dot-' + i;
        container.appendChild(dot);
      });
    }

    function goToStep(name) {
      const idx = stepSeq.indexOf(name);
      if (idx === -1) return;
      currentIdx = idx;

      ALL_STEPS.forEach(s => {
        document.getElementById('step-' + s).classList.toggle('visible', s === name);
      });
      renderIndicator();
    }

    function nextStep() {
      if (currentIdx + 1 < stepSeq.length) {
        goToStep(stepSeq[currentIdx + 1]);
      }
    }

    function prevStep() {
      if (currentIdx - 1 >= 0) {
        goToStep(stepSeq[currentIdx - 1]);
      }
    }

    // Initialize indicator
    renderIndicator();

    // ========================================
    // Step 1: Validation
    // ========================================
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

    // Browse
    document.getElementById('browseBtn').addEventListener('click', () => {
      vscode.postMessage({ type: 'browseDirectory' });
    });

    // Quick Create
    document.getElementById('quickCreateBtn').addEventListener('click', () => {
      if (!validateStep1()) return;
      stepSeq = ['info', 'progress', 'finish'];
      goToStep('progress');
      vscode.postMessage({
        type: 'quickCreate',
        name: document.getElementById('appName').value.trim(),
        targetDir: document.getElementById('targetDir').value.trim(),
      });
    });

    // Next → Modules
    document.getElementById('nextToModulesBtn').addEventListener('click', () => {
      if (!validateStep1()) return;
      rebuildStepSeq();
      goToStep('modules');
    });

    // ========================================
    // Step 2: Module cards
    // ========================================
    document.querySelectorAll('.module-card').forEach(card => {
      const cb = card.querySelector('input[type="checkbox"]');
      card.addEventListener('click', (e) => {
        if (e.target === cb) return;
        cb.checked = !cb.checked;
        card.classList.toggle('selected', cb.checked);
        rebuildStepSeq();
        updateModulesNextLabel();
      });
      cb.addEventListener('change', () => {
        card.classList.toggle('selected', cb.checked);
        rebuildStepSeq();
        updateModulesNextLabel();
      });
    });

    function updateModulesNextLabel() {
      const btn = document.getElementById('modulesNextBtn');
      btn.textContent = (isFlavorsSelected() || isCicdSelected()) ? 'Next' : 'Create';
    }

    document.getElementById('backToInfoBtn').addEventListener('click', () => goToStep('info'));

    // Modules Next/Create button
    document.getElementById('modulesNextBtn').addEventListener('click', () => {
      rebuildStepSeq();
      if (isFlavorsSelected()) {
        buildEnvSections();
        goToStep('flavors');
      } else if (isCicdSelected()) {
        goToStep('cicd');
      } else {
        startFullCreate();
      }
    });

    // ========================================
    // Step: Flavors Config
    // ========================================
    function parseEnvNames() {
      return document.getElementById('envNames').value
        .split(',')
        .map(s => s.trim().toLowerCase())
        .filter(s => /^[a-z][a-z0-9_]*$/.test(s));
    }

    function buildEnvSections() {
      const names = parseEnvNames();
      const container = document.getElementById('envSections');
      container.innerHTML = '';

      names.forEach((name, i) => {
        const isLast = i === names.length - 1;
        const capFirst = name.charAt(0).toUpperCase() + name.slice(1);
        const defaultApiUrl = 'https://' + name + '-api.example.com';
        const defaultAppSuffix = isLast ? '' : ' ' + capFirst;
        const defaultIdSuffix = isLast ? '' : '.' + name;

        const section = document.createElement('div');
        section.className = 'env-section';
        section.setAttribute('data-env', name);
        section.innerHTML =
          '<div class="env-section-title">' + esc(name) + '</div>' +
          '<div class="field">' +
            '<label class="field-label">API Base URL</label>' +
            '<input type="text" class="text-input env-api" value="' + esc(defaultApiUrl) + '">' +
          '</div>' +
          '<div class="field">' +
            '<label class="field-label">App Name Suffix</label>' +
            '<input type="text" class="text-input env-app-suffix" value="' + esc(defaultAppSuffix) + '" placeholder="e.g. Dev">' +
          '</div>' +
          '<div class="field">' +
            '<label class="field-label">App ID Suffix</label>' +
            '<input type="text" class="text-input env-id-suffix" value="' + esc(defaultIdSuffix) + '" placeholder="e.g. .dev">' +
          '</div>';
        container.appendChild(section);
      });

      // Default env radios
      const radios = document.getElementById('defaultEnvRadios');
      radios.innerHTML = '';
      names.forEach((name, i) => {
        const isLast = i === names.length - 1;
        const label = document.createElement('label');
        label.innerHTML = '<input type="radio" name="defaultEnv" value="' + esc(name) + '"' +
          (isLast ? ' checked' : '') + '> ' + esc(name);
        radios.appendChild(label);
      });
    }

    // Rebuild env sections when env names input changes
    let envDebounce;
    document.getElementById('envNames').addEventListener('input', () => {
      clearTimeout(envDebounce);
      envDebounce = setTimeout(buildEnvSections, 400);
    });

    function validateFlavors() {
      const names = parseEnvNames();
      document.getElementById('err-envNames').textContent = '';

      if (names.length === 0) {
        document.getElementById('err-envNames').textContent = 'Enter at least one environment name';
        return false;
      }

      const defaultRadio = document.querySelector('input[name="defaultEnv"]:checked');
      if (!defaultRadio) {
        document.getElementById('err-defaultEnv').textContent = 'Select a default environment';
        return false;
      }
      document.getElementById('err-defaultEnv').textContent = '';
      return true;
    }

    function collectFlavorsConfig() {
      const names = parseEnvNames();
      const sections = document.querySelectorAll('.env-section');
      const envs = [];
      sections.forEach(section => {
        envs.push({
          apiUrl: section.querySelector('.env-api').value,
          appSuffix: section.querySelector('.env-app-suffix').value,
          idSuffix: section.querySelector('.env-id-suffix').value,
        });
      });
      const defaultRadio = document.querySelector('input[name="defaultEnv"]:checked');
      return {
        envNames: names.join(', '),
        envs: envs,
        defaultEnv: defaultRadio ? defaultRadio.value : names[names.length - 1],
      };
    }

    document.getElementById('flavorsBackBtn').addEventListener('click', () => goToStep('modules'));

    document.getElementById('flavorsNextBtn').addEventListener('click', () => {
      if (!validateFlavors()) return;
      if (isCicdSelected()) {
        goToStep('cicd');
      } else {
        startFullCreate();
      }
    });

    // ========================================
    // Step: CI/CD Config
    // ========================================
    document.querySelectorAll('.cicd-option, .cicd-grid [data-platform]').forEach(card => {
      const cb = card.querySelector('input[type="checkbox"]');
      card.addEventListener('click', (e) => {
        if (e.target === cb) return;
        cb.checked = !cb.checked;
        card.classList.toggle('selected', cb.checked);
      });
      cb.addEventListener('change', () => {
        card.classList.toggle('selected', cb.checked);
      });
      // init
      if (cb.checked) card.classList.add('selected');
    });

    function collectCicdConfig() {
      const steps = Array.from(document.querySelectorAll('.cicd-option[data-step] input:checked'))
        .map(cb => parseInt(cb.value, 10));
      const branches = document.getElementById('cicdBranches').value.trim();
      const platforms = Array.from(document.querySelectorAll('[data-platform] input:checked'))
        .map(cb => parseInt(cb.value, 10));
      return { steps: steps, branches: branches, platforms: platforms.length > 0 ? platforms : [1] };
    }

    document.getElementById('cicdBackBtn').addEventListener('click', () => {
      if (isFlavorsSelected()) goToStep('flavors');
      else goToStep('modules');
    });

    document.getElementById('cicdNextBtn').addEventListener('click', () => {
      startFullCreate();
    });

    // ========================================
    // Start full create
    // ========================================
    function startFullCreate() {
      rebuildStepSeq();
      goToStep('progress');

      const selected = Array.from(document.querySelectorAll('.module-card input:checked'))
        .map(cb => cb.value);

      const payload = {
        type: 'fullCreate',
        name: document.getElementById('appName').value.trim(),
        org: document.getElementById('orgName').value.trim(),
        targetDir: document.getElementById('targetDir').value.trim(),
        modules: selected,
      };

      if (isFlavorsSelected()) {
        payload.flavorsConfig = collectFlavorsConfig();
      }

      if (isCicdSelected()) {
        payload.cicdConfig = collectCicdConfig();
      }

      vscode.postMessage(payload);
    }

    // ========================================
    // Open Project
    // ========================================
    document.getElementById('openProjectBtn').addEventListener('click', () => {
      vscode.postMessage({ type: 'openProject' });
    });

    document.getElementById('openNewWindowBtn').addEventListener('click', () => {
      vscode.postMessage({ type: 'openProjectNewWindow' });
    });

    // ========================================
    // Messages from extension
    // ========================================
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
          goToStep('finish');
          document.getElementById('finishTitle').textContent = 'Project Created!';
          document.getElementById('finishSub').textContent = '"' + msg.name + '" is ready.';
          break;

        case 'error':
          goToStep('finish');
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

    // Helper
    function esc(s) {
      const d = document.createElement('div');
      d.textContent = s;
      return d.innerHTML;
    }
  </script>
</body>
</html>`;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
