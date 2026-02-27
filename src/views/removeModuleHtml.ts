export interface RemoveModuleOption {
  value: string;
  label: string;
  description: string;
  depNote?: string; // e.g. "Also removes: ai"
}

export function generateRemoveModuleHtml(nonce: string, modules: RemoveModuleOption[]): string {
  const moduleCards = modules
    .map(m => {
      const depHtml = m.depNote
        ? `<span class="card-dep">${esc(m.depNote)}</span>`
        : '';
      return `
      <div class="module-card" data-module="${esc(m.value)}">
        <input type="radio" name="module" value="${esc(m.value)}">
        <div class="card-body">
          <span class="card-title">${esc(m.label)}</span>
          <span class="card-desc">${esc(m.description)}</span>
          ${depHtml}
        </div>
      </div>`;
    })
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
      width: 28px; height: 28px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 600;
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
      flex: 1; height: 2px;
      background: var(--vscode-input-border, rgba(128,128,128,0.3));
    }

    .step-line.done {
      background: var(--vscode-testing-iconPassed, #4caf50);
    }

    .wizard-title { font-size: 20px; font-weight: 600; margin-bottom: 20px; }

    .step { display: none; }
    .step.visible { display: block; }

    /* --- Info / Warning banners --- */
    .info-banner {
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 12px;
      margin-bottom: 16px;
      background: color-mix(in srgb, var(--vscode-focusBorder) 10%, var(--vscode-editor-background));
      border: 1px solid color-mix(in srgb, var(--vscode-focusBorder) 30%, transparent);
      color: var(--vscode-editor-foreground);
    }

    .warning-banner {
      padding: 10px 14px;
      border-radius: 6px;
      font-size: 12px;
      margin-bottom: 16px;
      background: color-mix(in srgb, var(--vscode-errorForeground, #f44) 8%, var(--vscode-editor-background));
      border: 1px solid color-mix(in srgb, var(--vscode-errorForeground, #f44) 25%, transparent);
      color: var(--vscode-editor-foreground);
    }

    .warning-banner strong { color: var(--vscode-errorForeground, #f44); }

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
      padding: 9px 20px; border: none; border-radius: 4px; cursor: pointer;
      font-size: 13px; font-family: var(--vscode-font-family); font-weight: 500;
      transition: background 0.15s;
    }

    .btn-primary { background: var(--vscode-button-background); color: var(--vscode-button-foreground); }
    .btn-primary:hover { background: var(--vscode-button-hoverBackground); }
    .btn-secondary { background: var(--vscode-button-secondaryBackground); color: var(--vscode-button-secondaryForeground); }
    .btn-secondary:hover { background: var(--vscode-button-secondaryHoverBackground); }
    .btn-danger { background: var(--vscode-errorForeground, #d32f2f); color: #fff; }
    .btn-danger:hover { opacity: 0.9; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }

    /* --- Module Grid --- */
    .module-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
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

    .module-card input[type="radio"] {
      margin-top: 2px; flex-shrink: 0;
      accent-color: var(--vscode-button-background);
    }

    .card-body { flex: 1; min-width: 0; }
    .card-title { display: block; font-weight: 600; font-size: 13px; }
    .card-desc { display: block; font-size: 11px; color: var(--vscode-descriptionForeground); margin-top: 2px; }
    .card-dep { display: block; font-size: 10px; color: var(--vscode-errorForeground, #f44); margin-top: 4px; font-style: italic; }

    .field-error {
      font-size: 12px;
      color: var(--vscode-errorForeground, #f44);
      margin-top: 3px;
      min-height: 16px;
    }

    /* --- Confirm: summary list --- */
    .confirm-list {
      list-style: none;
      padding: 0;
      margin: 12px 0;
    }

    .confirm-list li {
      padding: 8px 12px;
      border-radius: 4px;
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border, rgba(128,128,128,0.3));
      margin-bottom: 6px;
      font-size: 13px;
    }

    .confirm-list li .tag {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 10px;
      margin-left: 8px;
      background: color-mix(in srgb, var(--vscode-errorForeground, #f44) 15%, var(--vscode-input-background));
      color: var(--vscode-errorForeground, #f44);
    }

    /* --- Progress --- */
    .log-area {
      width: 100%; height: 280px; overflow-y: auto;
      padding: 12px; border-radius: 4px;
      background: var(--vscode-terminal-background, #1e1e1e);
      color: var(--vscode-terminal-foreground, #cccccc);
      font-family: var(--vscode-editor-font-family, 'Consolas', monospace);
      font-size: 12px; line-height: 1.5; white-space: pre-wrap; word-break: break-all;
      margin-top: 12px;
    }

    .progress-label {
      font-size: 13px; margin-bottom: 8px;
      color: var(--vscode-descriptionForeground);
    }

    /* --- Finish --- */
    .finish-icon { font-size: 48px; text-align: center; margin-bottom: 16px; color: var(--vscode-testing-iconPassed, #4caf50); }
    .finish-title { font-size: 20px; font-weight: 600; text-align: center; margin-bottom: 8px; }
    .finish-sub { text-align: center; color: var(--vscode-descriptionForeground); font-size: 13px; margin-bottom: 24px; }
    .finish-actions { display: flex; justify-content: center; gap: 10px; }

    .error-msg {
      color: var(--vscode-errorForeground, #f44);
      text-align: center; margin-bottom: 12px; font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="wizard">
    <div class="step-indicator" id="stepIndicator"></div>

    <!-- STEP: Select Module -->
    <div class="step visible" id="step-select">
      <h2 class="wizard-title">Remove Module</h2>
      <div class="module-grid">
        ${moduleCards}
      </div>
      <div class="field-error" id="err-module" style="margin-top:8px;"></div>
      <div class="actions">
        <button type="button" class="btn btn-primary" disabled id="selectNextBtn">Next</button>
      </div>
    </div>

    <!-- STEP: Confirm -->
    <div class="step" id="step-confirm">
      <h2 class="wizard-title">Confirm Removal</h2>
      <div class="warning-banner">
        <strong>Warning:</strong> main.dart, app.dart, and locator.dart will be regenerated.
      </div>
      <div id="confirmDepWarning" style="display:none;" class="warning-banner"></div>
      <p style="font-size:13px; margin-bottom:8px;">The following will be removed:</p>
      <ul class="confirm-list" id="confirmList"></ul>
      <div class="actions">
        <button type="button" class="btn btn-secondary" id="confirmBackBtn">Back</button>
        <button type="button" class="btn btn-danger" id="confirmRemoveBtn">Remove</button>
      </div>
    </div>

    <!-- STEP: Progress -->
    <div class="step" id="step-progress">
      <h2 class="wizard-title">Removing Module...</h2>
      <div class="progress-label" id="progressLabel">Starting...</div>
      <div class="log-area" id="logArea"></div>
    </div>

    <!-- STEP: Finish -->
    <div class="step" id="step-finish">
      <div class="finish-icon" id="finishIcon">&#10003;</div>
      <div class="finish-title" id="finishTitle">Module Removed!</div>
      <div class="finish-sub" id="finishSub"></div>
      <div class="error-msg" id="errorMsg" style="display:none;"></div>
      <div class="finish-actions">
        <button type="button" class="btn btn-primary" id="doneBtn">Done</button>
      </div>
    </div>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();

    const ALL_STEPS = ['select', 'confirm', 'progress', 'finish'];
    const stepSeq = ['select', 'confirm', 'progress', 'finish'];
    let currentIdx = 0;
    let selectedModule = null;
    let selectedDepNote = null;

    function renderIndicator() {
      const container = document.getElementById('stepIndicator');
      container.innerHTML = '';
      stepSeq.forEach((id, i) => {
        if (i > 0) {
          const line = document.createElement('div');
          line.className = 'step-line' + (i <= currentIdx ? ' done' : '');
          container.appendChild(line);
        }
        const dot = document.createElement('div');
        dot.className = 'step-dot';
        if (i < currentIdx) dot.classList.add('done');
        else if (i === currentIdx) dot.classList.add('active');
        dot.textContent = String(i + 1);
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

    renderIndicator();

    // ========================================
    // Step 1: Select
    // ========================================
    const selectBtn = document.getElementById('selectNextBtn');

    document.querySelectorAll('.module-card').forEach(card => {
      const radio = card.querySelector('input[type="radio"]');
      card.addEventListener('click', (e) => {
        if (e.target === radio) return;
        document.querySelectorAll('.module-card').forEach(c => {
          c.classList.remove('selected');
          c.querySelector('input[type="radio"]').checked = false;
        });
        radio.checked = true;
        card.classList.add('selected');
        selectedModule = radio.value;
        const dep = card.querySelector('.card-dep');
        selectedDepNote = dep ? dep.textContent : null;
        selectBtn.disabled = false;
        document.getElementById('err-module').textContent = '';
      });
      radio.addEventListener('change', () => {
        document.querySelectorAll('.module-card').forEach(c => {
          c.classList.toggle('selected', c.querySelector('input[type="radio"]').checked);
        });
        if (radio.checked) {
          selectedModule = radio.value;
          const dep = card.querySelector('.card-dep');
          selectedDepNote = dep ? dep.textContent : null;
          selectBtn.disabled = false;
        }
      });
    });

    selectBtn.addEventListener('click', () => {
      if (!selectedModule) {
        document.getElementById('err-module').textContent = 'Select a module';
        return;
      }
      buildConfirmStep();
      goToStep('confirm');
    });

    // ========================================
    // Step 2: Confirm
    // ========================================
    function buildConfirmStep() {
      const list = document.getElementById('confirmList');
      list.innerHTML = '';

      const li = document.createElement('li');
      li.textContent = selectedModule;
      list.appendChild(li);

      const depWarning = document.getElementById('confirmDepWarning');
      if (selectedDepNote) {
        depWarning.innerHTML = '<strong>Dependency:</strong> ' + esc(selectedDepNote);
        depWarning.style.display = 'block';
      } else {
        depWarning.style.display = 'none';
      }
    }

    document.getElementById('confirmBackBtn').addEventListener('click', () => goToStep('select'));

    document.getElementById('confirmRemoveBtn').addEventListener('click', () => {
      goToStep('progress');
      vscode.postMessage({ type: 'removeModule', module: selectedModule });
    });

    // ========================================
    // Done
    // ========================================
    document.getElementById('doneBtn').addEventListener('click', () => {
      vscode.postMessage({ type: 'close' });
    });

    // ========================================
    // Messages from extension
    // ========================================
    window.addEventListener('message', event => {
      const msg = event.data;

      switch (msg.type) {
        case 'output': {
          const log = document.getElementById('logArea');
          log.textContent += msg.text;
          log.scrollTop = log.scrollHeight;
          break;
        }

        case 'progress':
          document.getElementById('progressLabel').textContent = msg.label || 'Working...';
          break;

        case 'complete':
          goToStep('finish');
          document.getElementById('finishTitle').textContent = 'Module Removed!';
          document.getElementById('finishSub').textContent = '"' + msg.module + '" has been removed from the project.';
          break;

        case 'error':
          goToStep('finish');
          document.getElementById('finishIcon').textContent = '\\u2717';
          document.getElementById('finishIcon').style.color = 'var(--vscode-errorForeground, #f44)';
          document.getElementById('finishTitle').textContent = 'Failed';
          document.getElementById('finishSub').style.display = 'none';
          document.getElementById('errorMsg').style.display = 'block';
          document.getElementById('errorMsg').textContent = msg.message;
          break;
      }
    });

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
