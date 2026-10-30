import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders, Provider } from '@angular/core';
import { FormlyFieldConfig, provideFormlyConfig, withFormlyFieldExpression } from '@ngx-formly/core';
import { isGroup } from './document';
import { SettingsField } from './settings-field';
import { DocumentIssue } from './validate';

export interface FieldTypeDefinition {
  /** The Formly type. Hosts register the component for a custom type the normal Formly way. */
  type: string;
  label: string;
  /** Trusted SVG markup from the developer's own configuration. Never taken from a document. */
  icon: string;
  defaults?: { props?: FormlyFieldConfig['props'] };
  /** Extra settings, as Formly fields bound to the field's `props`. */
  settings?: FormlyFieldConfig[];
}

export interface FormBuilderMessages {
  palette: string;
  canvas: string;
  settings: string;
  edit: string;
  preview: string;
  undo: string;
  redo: string;
  emptyCanvas: string;
  emptyGroup: string;
  noSelection: string;
  closeSettings: string;
  actionsFor: (label: string) => string;
  moveUp: string;
  moveDown: string;
  moveToTop: string;
  moveToGroup: (label: string) => string;
  duplicate: string;
  remove: string;
  required: string;
  conditional: string;
  hasIssue: string;
  advanced: string;
  dataKey: string;
  submittedData: string;
  previewBlocked: string;
  showWhen: string;
  addCondition: string;
  removeCondition: string;
  matchAll: string;
  matchAny: string;
  conditionMatch: string;
  conditionField: string;
  conditionOp: string;
  conditionValue: string;
  noCandidates: string;
  customCondition: string;
  replaceCustomCondition: string;
  ops: Record<'equals' | 'notEquals' | 'isEmpty' | 'isNotEmpty' | 'greaterThan' | 'lessThan', string>;
  yes: string;
  no: string;
  confirmDelete: (label: string) => string;
  confirmDeleteBody: string;
  cancel: string;
  added: (label: string, position: number) => string;
  moved: (label: string, position: number) => string;
  removed: (label: string) => string;
  duplicated: (label: string) => string;
  undone: string;
  redone: string;
  issues: Record<DocumentIssue['code'], string>;
  loadError: string;
  settingLabels: {
    label: string;
    required: string;
    placeholder: string;
    min: string;
    max: string;
    minLength: string;
    maxLength: string;
    pattern: string;
    options: string;
    errorMessage: string;
  };
  typeLabels: { text: string; textarea: string; number: string; email: string; date: string; checkbox: string; radio: string; select: string; group: string };
}

export const DEFAULT_MESSAGES: FormBuilderMessages = {
  palette: 'Add a field',
  canvas: 'Form',
  settings: 'Settings',
  edit: 'Edit',
  preview: 'Preview',
  undo: 'Undo',
  redo: 'Redo',
  emptyCanvas: 'Drag a field here, or choose one from the list',
  emptyGroup: 'Drop fields into this group',
  noSelection: 'Select a field to change its settings',
  closeSettings: 'Close settings',
  actionsFor: (label) => `Actions for ${label}`,
  moveUp: 'Move up',
  moveDown: 'Move down',
  moveToTop: 'Move out of group',
  moveToGroup: (label) => `Move to ${label}`,
  duplicate: 'Duplicate',
  remove: 'Delete',
  required: 'Required',
  conditional: 'Conditional',
  hasIssue: 'Needs attention',
  advanced: 'Advanced',
  dataKey: 'Data key',
  submittedData: 'Submitted data',
  previewBlocked: 'This form contains something that can’t be previewed safely. Fix the flagged fields first.',
  showWhen: 'Show this field when',
  addCondition: 'Add condition',
  removeCondition: 'Remove condition',
  matchAll: 'All conditions match',
  matchAny: 'Any condition matches',
  conditionMatch: 'Match',
  conditionField: 'Field',
  conditionOp: 'Comparison',
  conditionValue: 'Value',
  noCandidates: 'Add another field to create a condition',
  customCondition: 'This field has a custom condition written by a developer:',
  replaceCustomCondition: 'Remove custom condition',
  ops: {
    equals: 'is',
    notEquals: 'is not',
    isEmpty: 'is empty',
    isNotEmpty: 'is not empty',
    greaterThan: 'is greater than',
    lessThan: 'is less than',
  },
  yes: 'Yes',
  no: 'No',
  confirmDelete: (label) => `Delete ${label}?`,
  confirmDeleteBody: 'These fields have conditions that use it. Those conditions will be removed:',
  cancel: 'Cancel',
  added: (label, position) => `${label} added at position ${position}`,
  moved: (label, position) => `${label} moved to position ${position}`,
  removed: (label) => `${label} deleted`,
  duplicated: (label) => `${label} duplicated`,
  undone: 'Undone',
  redone: 'Redone',
  issues: {
    'invalid-document': 'This isn’t a valid form document.',
    'newer-version': 'This form was made with a newer version of the builder.',
    'not-json': 'This form contains data that can’t be saved as JSON.',
    'duplicate-id': 'This form has fields with missing or duplicate IDs.',
    'missing-key': 'This field has no data key.',
    'invalid-key': 'The data key must start with a letter and contain only letters, numbers, _ or $.',
    'duplicate-key': 'Another field uses this data key.',
    'missing-options': 'Add at least one option.',
    'missing-label': 'Add a label.',
    'unknown-type': 'This field type isn’t available here. It’s kept, but can’t be previewed.',
    'broken-condition': 'A condition refers to a field that no longer exists.',
    'condition-cycle': 'Some conditions depend on each other, so those fields may never appear.',
    'custom-condition': 'This field has a custom condition.',
    'unsafe-expression': 'This field’s condition contains code that isn’t allowed.',
  },
  loadError: 'This form can’t be opened.',
  settingLabels: {
    label: 'Label',
    required: 'Required',
    placeholder: 'Placeholder',
    min: 'Minimum',
    max: 'Maximum',
    minLength: 'Minimum length',
    maxLength: 'Maximum length',
    pattern: 'Pattern (regular expression)',
    options: 'Options, one per line',
    errorMessage: 'Error message',
  },
  typeLabels: {
    text: 'Text',
    textarea: 'Long text',
    number: 'Number',
    email: 'Email',
    date: 'Date',
    checkbox: 'Checkbox',
    radio: 'Radio buttons',
    select: 'Dropdown',
    group: 'Group',
  },
};

const svg = (path: string) =>
  `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;

/** The palette entry for a group. Groups have no Formly type, so this marker never reaches a document. */
export const GROUP_TYPE = 'group';

function setting(key: string, label: string, control: string, extra: Partial<FormlyFieldConfig> = {}): FormlyFieldConfig {
  const updatesOnChange = control === 'checkbox';
  return {
    key,
    type: SettingsField,
    props: { label, control },
    ...(updatesOnChange ? {} : { modelOptions: { updateOn: 'blur' as const } }),
    ...extra,
  };
}

function builtInSettings(messages: FormBuilderMessages) {
  const s = messages.settingLabels;
  const placeholder = setting('placeholder', s.placeholder, 'text');
  const lengths = [
    setting('minLength', s.minLength, 'number'),
    setting('maxLength', s.maxLength, 'number'),
    setting('pattern', s.pattern, 'text'),
  ];
  const range = [setting('min', s.min, 'number'), setting('max', s.max, 'number')];
  const options = setting('options', s.options, 'options');
  return { placeholder, lengths, range, options };
}

export function builtInFieldTypes(messages: FormBuilderMessages): FieldTypeDefinition[] {
  const t = messages.typeLabels;
  const { placeholder, lengths, range, options } = builtInSettings(messages);
  const input = (type: string) => ({ props: { type } });
  return [
    { type: 'input', label: t.text, icon: svg('<path d="M4 7V5h16v2M12 5v14M9 19h6"/>'), defaults: input('text'), settings: [placeholder, ...lengths] },
    { type: 'textarea', label: t.textarea, icon: svg('<path d="M4 6h16M4 11h16M4 16h10"/>'), settings: [placeholder, ...lengths] },
    { type: 'input', label: t.number, icon: svg('<path d="M9 4 7 20M17 4l-2 16M4 9h16M3 15h16"/>'), defaults: input('number'), settings: [placeholder, ...range] },
    { type: 'input', label: t.email, icon: svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'), defaults: input('email'), settings: [placeholder, lengths[2]] },
    { type: 'input', label: t.date, icon: svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>'), defaults: input('date') },
    { type: 'checkbox', label: t.checkbox, icon: svg('<rect x="4" y="4" width="16" height="16" rx="2"/><path d="m8 12 3 3 5-6"/>'), defaults: { props: { indeterminate: false } } },
    { type: 'radio', label: t.radio, icon: svg('<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3" fill="currentColor"/>'), defaults: { props: { options: [{ label: 'Option 1', value: 'Option 1' }] } }, settings: [options] },
    { type: 'select', label: t.select, icon: svg('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="m9 11 3 3 3-3"/>'), defaults: { props: { options: [{ label: 'Option 1', value: 'Option 1' }] } }, settings: [options] },
    { type: GROUP_TYPE, label: t.group, icon: svg('<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/>') },
  ];
}

export function coreSettings(messages: FormBuilderMessages, group: boolean): FormlyFieldConfig[] {
  const s = messages.settingLabels;
  if (group) return [setting('label', s.label, 'text')];
  return [setting('label', s.label, 'text'), setting('required', s.required, 'checkbox')];
}

export function errorMessageSetting(messages: FormBuilderMessages): FormlyFieldConfig {
  return setting('errorMessage', messages.settingLabels.errorMessage, 'text');
}

/** The registry entry for a field. Input variants share a Formly type, so `props.type` tells them apart. */
export function definitionFor(definitions: readonly FieldTypeDefinition[], field: FormlyFieldConfig): FieldTypeDefinition | undefined {
  if (isGroup(field)) return definitions.find((d) => d.type === GROUP_TYPE);
  const matches = definitions.filter((d) => d.type === field.type);
  return matches.find((d) => d.defaults?.props?.['type'] === field.props?.['type']) ?? matches[0];
}

export interface FormBuilderOptions {
  fieldTypes?: FieldTypeDefinition[];
  messages?: Partial<FormBuilderMessages>;
}

export interface FormBuilderConfig {
  definitions: FieldTypeDefinition[];
  messages: FormBuilderMessages;
}

function resolveConfig(options: FormBuilderOptions): FormBuilderConfig {
  const messages = { ...DEFAULT_MESSAGES, ...options.messages };
  return { messages, definitions: [...builtInFieldTypes(messages), ...(options.fieldTypes ?? [])] };
}

export const FORM_BUILDER_CONFIG = new InjectionToken<FormBuilderConfig>('FORM_BUILDER_CONFIG', {
  factory: () => resolveConfig({}),
});

/**
 * Configures the builder. Also turns on Formly's safe expression parser for this injector, so the builder's
 * own Preview never evaluates a document's expressions with `new Function`.
 */
export function provideFormBuilder(options: FormBuilderOptions = {}): EnvironmentProviders {
  const providers: Provider[] = [{ provide: FORM_BUILDER_CONFIG, useValue: resolveConfig(options) }];
  return makeEnvironmentProviders([providers, provideFormlyConfig(withFormlyFieldExpression())]);
}
