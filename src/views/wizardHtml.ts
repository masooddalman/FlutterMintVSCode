import { WizardConfig, WizardField } from './wizardFields';

export function generateWizardHtml(config: WizardConfig): string {
  const nonce = getNonce();
  const fieldsHtml = config.fields.map(renderField).join('\n');
  const submitLabel = config.submitLabel || 'Confirm';
  const cancelLabel = config.cancelLabel || 'Cancel';

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
      padding: 0;
      margin: 0;
      display: flex;
      justify-content: center;
    }

    .wizard-container {
      width: 100%;
      max-width: 640px;
      padding: 32px 24px;
    }

    .wizard-title {
      font-size: 22px;
      font-weight: 600;
      margin-bottom: 28px;
      color: var(--vscode-editor-foreground);
    }

    /* --- Field --- */
    .field {
      margin-bottom: 22px;
    }

    .field-label {
      display: block;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 6px;
      color: var(--vscode-editor-foreground);
    }

    .field-label .required-star {
      color: var(--vscode-errorForeground, #f44);
      margin-left: 2px;
    }

    .field-error {
      display: block;
      font-size: 12px;
      color: var(--vscode-errorForeground, #f44);
      margin-top: 4px;
      min-height: 16px;
    }

    /* --- Text Input --- */
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

    /* --- Card Grid --- */
    .card-grid {
      display: grid;
      gap: 8px;
    }

    .card-option {
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

    .card-option:hover {
      border-color: var(--vscode-focusBorder);
    }

    .card-option.selected {
      border-color: var(--vscode-focusBorder);
      background: color-mix(in srgb, var(--vscode-focusBorder) 12%, var(--vscode-input-background));
    }

    .card-option input[type="checkbox"],
    .card-option input[type="radio"] {
      margin-top: 2px;
      flex-shrink: 0;
      accent-color: var(--vscode-button-background);
    }

    .card-content {
      flex: 1;
      min-width: 0;
    }

    .card-label {
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

    /* --- Key-Value List --- */
    .kv-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .kv-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .kv-row .text-input {
      flex: 1;
    }

    .kv-sep {
      font-weight: 600;
      color: var(--vscode-descriptionForeground);
      flex-shrink: 0;
    }

    .kv-remove {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 4px;
      background: transparent;
      color: var(--vscode-descriptionForeground);
      cursor: pointer;
      font-size: 16px;
      flex-shrink: 0;
      transition: background 0.15s, color 0.15s;
    }

    .kv-remove:hover {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-errorForeground, #f44);
    }

    .kv-add-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border: 1px dashed var(--vscode-input-border, rgba(128,128,128,0.4));
      border-radius: 4px;
      background: transparent;
      color: var(--vscode-descriptionForeground);
      cursor: pointer;
      font-size: 12px;
      font-family: var(--vscode-font-family);
      margin-top: 6px;
      transition: border-color 0.15s, color 0.15s;
    }

    .kv-add-btn:hover {
      border-color: var(--vscode-focusBorder);
      color: var(--vscode-editor-foreground);
    }

    /* --- Directory Field --- */
    .directory-row {
      display: flex;
      gap: 8px;
    }

    .directory-row .text-input {
      flex: 1;
    }

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
    .wizard-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 32px;
      padding-top: 20px;
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

    .btn-primary:hover {
      background: var(--vscode-button-hoverBackground);
    }

    .btn-secondary {
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
    }

    .btn-secondary:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
  </style>
</head>
<body>
  <div class="wizard-container">
    <h1 class="wizard-title">${escapeHtml(config.title)}</h1>
    <form id="wizardForm">
      ${fieldsHtml}
      <div class="wizard-actions">
        <button type="button" class="btn btn-secondary" id="cancelBtn">${escapeHtml(cancelLabel)}</button>
        <button type="submit" class="btn btn-primary" id="submitBtn">${escapeHtml(submitLabel)}</button>
      </div>
    </form>
  </div>

  <script nonce="${nonce}">
    const vscode = acquireVsCodeApi();

    // --- Card selection toggle ---
    document.querySelectorAll('.card-option').forEach(card => {
      const input = card.querySelector('input');
      if (!input) return;

      card.addEventListener('click', (e) => {
        if (e.target === input) return; // let native checkbox/radio handle itself
        if (input.type === 'radio') {
          // deselect siblings
          const name = input.name;
          document.querySelectorAll('input[name="' + name + '"]').forEach(r => {
            r.checked = false;
            r.closest('.card-option').classList.remove('selected');
          });
          input.checked = true;
          card.classList.add('selected');
        } else {
          input.checked = !input.checked;
          card.classList.toggle('selected', input.checked);
        }
      });

      // Sync visual state when native input changes
      input.addEventListener('change', () => {
        if (input.type === 'radio') {
          const name = input.name;
          document.querySelectorAll('input[name="' + name + '"]').forEach(r => {
            r.closest('.card-option').classList.toggle('selected', r.checked);
          });
        } else {
          card.classList.toggle('selected', input.checked);
        }
      });

      // Init state
      if (input.checked) {
        card.classList.add('selected');
      }
    });

    // --- Directory picker ---
    document.querySelectorAll('.browse-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        vscode.postMessage({
          type: 'browseDirectory',
          fieldId: btn.getAttribute('data-field-id')
        });
      });
    });

    window.addEventListener('message', event => {
      const msg = event.data;
      if (msg.type === 'directorySelected') {
        const input = document.getElementById('field-' + msg.fieldId);
        if (input) {
          input.value = msg.path;
          input.classList.remove('invalid');
          const errEl = document.getElementById('error-' + msg.fieldId);
          if (errEl) errEl.textContent = '';
        }
      }
    });

    // --- Key-value list ---
    document.querySelectorAll('.kv-add-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const listId = btn.getAttribute('data-target');
        const list = document.getElementById(listId);
        const keyPh = btn.getAttribute('data-key-ph') || 'key';
        const valPh = btn.getAttribute('data-value-ph') || 'value';

        const row = document.createElement('div');
        row.className = 'kv-row';
        row.innerHTML =
          '<input type="text" class="text-input kv-key" placeholder="' + keyPh + '">' +
          '<span class="kv-sep">:</span>' +
          '<input type="text" class="text-input kv-value" placeholder="' + valPh + '">' +
          '<button type="button" class="kv-remove" title="Remove">\\u00d7</button>';

        row.querySelector('.kv-remove').addEventListener('click', () => row.remove());
        list.appendChild(row);
        row.querySelector('.kv-key').focus();
      });
    });

    // --- Validation ---
    function validateForm() {
      let valid = true;

      document.querySelectorAll('.field').forEach(field => {
        const type = field.getAttribute('data-type');
        const id = field.getAttribute('data-id');
        const req = field.getAttribute('data-required') === 'true';
        const errEl = document.getElementById('error-' + id);

        if (type === 'text' || type === 'directory') {
          const input = document.getElementById('field-' + id);
          const regex = input.getAttribute('data-validation');
          const msg = input.getAttribute('data-validation-msg') || 'Invalid format';

          if (errEl) errEl.textContent = '';
          input.classList.remove('invalid');

          if (req && !input.value.trim()) {
            if (errEl) errEl.textContent = field.querySelector('.field-label').textContent.replace('*','').trim() + ' is required';
            input.classList.add('invalid');
            valid = false;
          } else if (regex && input.value && !new RegExp(regex).test(input.value)) {
            if (errEl) errEl.textContent = msg;
            input.classList.add('invalid');
            valid = false;
          }
        }

        if (type === 'checkbox-grid' && req) {
          const checked = field.querySelectorAll('input:checked');
          if (checked.length === 0) {
            if (errEl) errEl.textContent = 'Select at least one option';
            valid = false;
          } else {
            if (errEl) errEl.textContent = '';
          }
        }

        if (type === 'radio-grid' && req) {
          const checked = field.querySelector('input:checked');
          if (!checked) {
            if (errEl) errEl.textContent = 'Select an option';
            valid = false;
          } else {
            if (errEl) errEl.textContent = '';
          }
        }
      });

      return valid;
    }

    // --- Collect form data ---
    function collectData() {
      const data = {};

      document.querySelectorAll('.field').forEach(field => {
        const type = field.getAttribute('data-type');
        const id = field.getAttribute('data-id');

        switch (type) {
          case 'text':
          case 'directory':
            data[id] = document.getElementById('field-' + id).value;
            break;
          case 'checkbox-grid':
            data[id] = Array.from(field.querySelectorAll('input:checked')).map(cb => cb.value);
            break;
          case 'radio-grid': {
            const checked = field.querySelector('input:checked');
            data[id] = checked ? checked.value : null;
            break;
          }
          case 'key-value-list': {
            const rows = field.querySelectorAll('.kv-row');
            data[id] = Array.from(rows)
              .map(row => ({
                key: row.querySelector('.kv-key').value.trim(),
                value: row.querySelector('.kv-value').value.trim(),
              }))
              .filter(r => r.key);
            break;
          }
        }
      });

      return data;
    }

    // --- Submit / Cancel ---
    document.getElementById('wizardForm').addEventListener('submit', (e) => {
      e.preventDefault();
      if (validateForm()) {
        vscode.postMessage({ type: 'submit', data: collectData() });
      }
    });

    document.getElementById('cancelBtn').addEventListener('click', () => {
      vscode.postMessage({ type: 'cancel' });
    });
  </script>
</body>
</html>`;
}

function renderField(field: WizardField): string {
  const reqStar = field.required ? '<span class="required-star">*</span>' : '';

  switch (field.type) {
    case 'text':
      return `<div class="field" data-type="text" data-id="${field.id}" data-required="${!!field.required}">
  <label class="field-label" for="field-${field.id}">${escapeHtml(field.label)}${reqStar}</label>
  <input type="text" class="text-input" id="field-${field.id}"
    placeholder="${escapeAttr(field.placeholder || '')}"
    value="${escapeAttr(field.defaultValue || '')}"
    ${field.validationRegex ? `data-validation="${escapeAttr(field.validationRegex)}"` : ''}
    ${field.validationMessage ? `data-validation-msg="${escapeAttr(field.validationMessage)}"` : ''}>
  <span class="field-error" id="error-${field.id}"></span>
</div>`;

    case 'checkbox-grid': {
      const cols = field.columns || 3;
      const cards = field.options.map(opt => `
    <label class="card-option${opt.checked ? ' selected' : ''}">
      <input type="checkbox" name="${field.id}" value="${escapeAttr(opt.value)}"${opt.checked ? ' checked' : ''}>
      <div class="card-content">
        <span class="card-label">${escapeHtml(opt.label)}</span>
        <span class="card-desc">${escapeHtml(opt.description)}</span>
      </div>
    </label>`).join('');

      return `<div class="field" data-type="checkbox-grid" data-id="${field.id}" data-required="${!!field.required}">
  <label class="field-label">${escapeHtml(field.label)}${reqStar}</label>
  <div class="card-grid" style="grid-template-columns: repeat(${cols}, 1fr)">
    ${cards}
  </div>
  <span class="field-error" id="error-${field.id}"></span>
</div>`;
    }

    case 'radio-grid': {
      const cols = field.columns || 3;
      const cards = field.options.map(opt => `
    <label class="card-option">
      <input type="radio" name="${field.id}" value="${escapeAttr(opt.value)}">
      <div class="card-content">
        <span class="card-label">${escapeHtml(opt.label)}</span>
        <span class="card-desc">${escapeHtml(opt.description)}</span>
      </div>
    </label>`).join('');

      return `<div class="field" data-type="radio-grid" data-id="${field.id}" data-required="${!!field.required}">
  <label class="field-label">${escapeHtml(field.label)}${reqStar}</label>
  <div class="card-grid" style="grid-template-columns: repeat(${cols}, 1fr)">
    ${cards}
  </div>
  <span class="field-error" id="error-${field.id}"></span>
</div>`;
    }

    case 'key-value-list':
      return `<div class="field" data-type="key-value-list" data-id="${field.id}" data-required="${!!field.required}">
  <label class="field-label">${escapeHtml(field.label)}${reqStar}</label>
  <div class="kv-list" id="kv-${field.id}"></div>
  <button type="button" class="kv-add-btn"
    data-target="kv-${field.id}"
    data-key-ph="${escapeAttr(field.keyPlaceholder || 'key')}"
    data-value-ph="${escapeAttr(field.valuePlaceholder || 'value')}">+ Add</button>
  <span class="field-error" id="error-${field.id}"></span>
</div>`;

    case 'directory':
      return `<div class="field" data-type="directory" data-id="${field.id}" data-required="${!!field.required}">
  <label class="field-label" for="field-${field.id}">${escapeHtml(field.label)}${reqStar}</label>
  <div class="directory-row">
    <input type="text" class="text-input" id="field-${field.id}"
      placeholder="${escapeAttr(field.placeholder || 'Select directory...')}"
      value="${escapeAttr(field.defaultValue || '')}"
      readonly>
    <button type="button" class="browse-btn" data-field-id="${field.id}">Browse...</button>
  </div>
  <span class="field-error" id="error-${field.id}"></span>
</div>`;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getNonce(): string {
  let text = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return text;
}
