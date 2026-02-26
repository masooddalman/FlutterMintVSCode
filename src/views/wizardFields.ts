/** Text input field with optional regex validation */
export interface TextField {
  type: 'text';
  id: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  validationRegex?: string;
  validationMessage?: string;
}

/** Grid of checkboxes — multi-select cards */
export interface CheckboxGridField {
  type: 'checkbox-grid';
  id: string;
  label: string;
  required?: boolean;
  columns?: number;
  options: Array<{
    value: string;
    label: string;
    description: string;
    checked: boolean;
  }>;
}

/** Grid of radio cards — single-select */
export interface RadioGridField {
  type: 'radio-grid';
  id: string;
  label: string;
  required?: boolean;
  columns?: number;
  options: Array<{
    value: string;
    label: string;
    description: string;
  }>;
}

/** Dynamic key-value pair rows */
export interface KeyValueListField {
  type: 'key-value-list';
  id: string;
  label: string;
  required?: boolean;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

/** Directory picker — text input + Browse button */
export interface DirectoryField {
  type: 'directory';
  id: string;
  label: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
}

export type WizardField =
  | TextField
  | CheckboxGridField
  | RadioGridField
  | KeyValueListField
  | DirectoryField;

export interface WizardConfig {
  id: string;
  title: string;
  fields: WizardField[];
  submitLabel?: string;
  cancelLabel?: string;
}
