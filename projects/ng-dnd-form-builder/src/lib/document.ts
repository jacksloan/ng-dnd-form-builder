import { FormlyFieldConfig } from '@ngx-formly/core';

export const SCHEMA_VERSION = 1;

/** A saved form: one JSON-serialisable Formly field that hosts can render directly. */
export type FormDocument = FormlyFieldConfig & {
  props: FormlyFieldConfig['props'] & { schemaVersion: number };
  fieldGroup: FormlyFieldConfig[];
};

export type ConditionOp =
  | 'equals'
  | 'notEquals'
  | 'isEmpty'
  | 'isNotEmpty'
  | 'greaterThan'
  | 'lessThan';

export interface Condition {
  /** Formly `id` of the referenced field. */
  field: string;
  op: ConditionOp;
  value?: string | number | boolean;
}

export interface ShowWhen {
  match: 'all' | 'any';
  conditions: Condition[];
}

export function createDocument(): FormDocument {
  return { props: { schemaVersion: SCHEMA_VERSION }, fieldGroup: [] };
}

export function walkFields(
  fields: readonly FormlyFieldConfig[],
  visit: (field: FormlyFieldConfig, parent: FormlyFieldConfig | null) => void,
  parent: FormlyFieldConfig | null = null,
): void {
  for (const field of fields) {
    visit(field, parent);
    if (field.fieldGroup) walkFields(field.fieldGroup, visit, field);
  }
}

export function allFields(doc: FormDocument): FormlyFieldConfig[] {
  const fields: FormlyFieldConfig[] = [];
  walkFields(doc.fieldGroup, (field) => fields.push(field));
  return fields;
}

export function findField(doc: FormDocument, id: string): FormlyFieldConfig | undefined {
  return allFields(doc).find((field) => field.id === id);
}

export function isGroup(field: FormlyFieldConfig): boolean {
  return Array.isArray(field.fieldGroup);
}

export function showWhenOf(field: FormlyFieldConfig): ShowWhen | undefined {
  return field.props?.['showWhen'] as ShowWhen | undefined;
}
