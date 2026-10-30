import { FormlyFieldConfig } from '@ngx-formly/core';
import { hasCustomCondition, hideExpression } from './conditions';
import { allFields, findField, FormDocument, isGroup, showWhenOf, ShowWhen } from './document';

export type Fields = FormlyFieldConfig[];

const VALIDATORS = ['required', 'min', 'max', 'minLength', 'maxLength', 'pattern'];

export function toKey(label: string): string {
  const words = label.match(/[\p{L}\p{N}]+/gu) ?? [];
  const key = words
    .map((word, i) => (i === 0 ? word.toLowerCase() : word[0].toUpperCase() + word.slice(1).toLowerCase()))
    .join('')
    .replace(/[^A-Za-z0-9_$]/g, '');
  return /^[A-Za-z_$]/.test(key) ? key : `field${key}`;
}

export function uniqueKey(doc: FormDocument, label: string, ignoreId?: string): string {
  const taken = new Set(allFields(doc).filter((f) => f.id !== ignoreId).map((f) => f.key));
  const base = toKey(label);
  let key = base;
  for (let n = 2; taken.has(key); n++) key = `${base}${n}`;
  return key;
}

/** Applies a change, then regenerates every builder-managed `hide` expression. Custom ones are left alone. */
function commit(doc: FormDocument, change: (fields: Fields) => Fields): FormDocument {
  const custom = new Set(allFields(doc).filter((f) => hasCustomCondition(f, doc)).map((f) => f.id));
  const known = new Set(allFields(doc).map((f) => f.id));
  const next: FormDocument = { ...doc, fieldGroup: change(doc.fieldGroup) };
  const sync = (fields: Fields): Fields =>
    fields.map((field) => {
      const synced = field.fieldGroup ? { ...field, fieldGroup: sync(field.fieldGroup) } : field;
      const showWhen = showWhenOf(field);
      if (custom.has(field.id) || (!known.has(field.id) && !showWhen)) return synced;
      const { hide: previous, ...others } = field.expressions ?? {};
      const hide = showWhen ? hideExpression(showWhen, next) : null;
      if (hide === (previous ?? null)) return synced;
      const expressions = hide ? { ...others, hide } : others;
      const { expressions: _removed, ...rest } = synced;
      return Object.keys(expressions).length ? { ...rest, expressions } : rest;
    });
  return { ...next, fieldGroup: sync(next.fieldGroup) };
}

function mapField(fields: Fields, id: string, change: (field: FormlyFieldConfig) => FormlyFieldConfig): Fields {
  return fields.map((field) => {
    if (field.id === id) return change(field);
    return field.fieldGroup ? { ...field, fieldGroup: mapField(field.fieldGroup, id, change) } : field;
  });
}

function insert(fields: Fields, field: FormlyFieldConfig, parentId: string | null, index: number): Fields {
  if (parentId === null) return [...fields.slice(0, index), field, ...fields.slice(index)];
  return mapField(fields, parentId, (parent) => ({
    ...parent,
    fieldGroup: insert(parent.fieldGroup ?? [], field, null, index),
  }));
}

function without(fields: Fields, id: string): Fields {
  return fields
    .filter((field) => field.id !== id)
    .map((field) => (field.fieldGroup ? { ...field, fieldGroup: without(field.fieldGroup, id) } : field));
}

/** Where a field sits: its parent group id (null for top level), and its index there. */
export function locate(doc: FormDocument, id: string): { parentId: string | null; index: number } | null {
  const search = (fields: Fields, parentId: string | null): { parentId: string | null; index: number } | null => {
    for (const [index, field] of fields.entries()) {
      if (field.id === id) return { parentId, index };
      const inner = field.fieldGroup && search(field.fieldGroup, field.id ?? null);
      if (inner) return inner;
    }
    return null;
  };
  return search(doc.fieldGroup, null);
}

export function idsWithin(field: FormlyFieldConfig): Set<string> {
  const ids = new Set<string>();
  const visit = (f: FormlyFieldConfig) => {
    if (f.id) ids.add(f.id);
    f.fieldGroup?.forEach(visit);
  };
  visit(field);
  return ids;
}

export function addField(doc: FormDocument, field: FormlyFieldConfig, parentId: string | null, index: number): FormDocument {
  return commit(doc, (fields) => insert(fields, field, parentId, index));
}

export function moveField(doc: FormDocument, id: string, parentId: string | null, index: number): FormDocument {
  const field = findField(doc, id);
  if (!field || (parentId !== null && idsWithin(field).has(parentId))) return doc;
  return commit(doc, (fields) => insert(without(fields, id), field, parentId, index));
}

/** Removes a field and any conditions that refer to it or to anything inside it. */
export function removeField(doc: FormDocument, id: string): FormDocument {
  const field = findField(doc, id);
  if (!field) return doc;
  const removed = idsWithin(field);
  const strip = (fields: Fields): Fields =>
    fields.map((f) => {
      const inner = f.fieldGroup ? { ...f, fieldGroup: strip(f.fieldGroup) } : f;
      const showWhen = showWhenOf(f);
      if (!showWhen?.conditions.some((c) => removed.has(c.field))) return inner;
      const conditions = showWhen.conditions.filter((c) => !removed.has(c.field));
      const { showWhen: _old, ...props } = f.props ?? {};
      return { ...inner, props: conditions.length ? { ...props, showWhen: { ...showWhen, conditions } } : props };
    });
  return commit(doc, (fields) => strip(without(fields, id)));
}

/** Copies a field beneath itself, with new ids and keys. Rules inside a copied group follow the copies. */
export function duplicateField(doc: FormDocument, id: string, newId: () => string): FormDocument {
  const field = findField(doc, id);
  const place = locate(doc, id);
  if (!field || !place) return doc;
  const ids = new Map<string, string>();
  for (const old of idsWithin(field)) ids.set(old, newId());
  const taken = { ...doc, fieldGroup: [...doc.fieldGroup] };
  const copy = (f: FormlyFieldConfig): FormlyFieldConfig => {
    const clone: FormlyFieldConfig = structuredClone({ ...f, fieldGroup: undefined });
    if (!f.fieldGroup) delete clone.fieldGroup;
    clone.id = ids.get(f.id!);
    if (typeof f.key === 'string') {
      clone.key = uniqueKey(taken, f.key);
      taken.fieldGroup.push({ key: clone.key });
    }
    const showWhen = showWhenOf(clone);
    if (showWhen) {
      for (const condition of showWhen.conditions) condition.field = ids.get(condition.field) ?? condition.field;
    }
    if (f.fieldGroup) clone.fieldGroup = f.fieldGroup.map(copy);
    return clone;
  };
  return commit(doc, (fields) => insert(fields, copy(field), place.parentId, place.index + 1));
}

export interface FieldPatch {
  key?: string;
  props?: FormlyFieldConfig['props'];
}

/** Applies settings. A field's key follows its label only until the default label is first replaced. */
export function updateField(doc: FormDocument, id: string, patch: FieldPatch, defaultLabel?: string): FormDocument {
  const field = findField(doc, id);
  if (!field) return doc;
  const props = { ...field.props, ...patch.props };
  let key = patch.key ?? field.key;
  const label = props['label'];
  if (
    patch.key === undefined &&
    typeof field.key === 'string' &&
    field.props?.['label'] === defaultLabel &&
    typeof label === 'string' &&
    label !== defaultLabel &&
    toKey(label)
  ) {
    key = uniqueKey(doc, label, id);
  }
  const message = props['errorMessage'];
  const { messages: _messages, ...validation } = field.validation ?? {};
  const next: FormlyFieldConfig = { ...field, props };
  if (key !== undefined && !isGroup(field)) next.key = key;
  if (message) {
    next.validation = { ...validation, messages: Object.fromEntries(VALIDATORS.map((v) => [v, String(message)])) };
  } else if (Object.keys(validation).length) {
    next.validation = validation;
  } else {
    delete next.validation;
  }
  return commit(doc, (fields) => mapField(fields, id, () => next));
}

/** Replaces a field's rule. Setting one takes over from any custom condition. */
export function setShowWhen(doc: FormDocument, id: string, showWhen: ShowWhen | null): FormDocument {
  return commit(stripHide(doc, id), (fields) =>
    mapField(fields, id, (field) => {
      const { showWhen: _old, ...props } = field.props ?? {};
      return { ...field, props: showWhen?.conditions.length ? { ...props, showWhen } : props };
    }),
  );
}

function stripHide(doc: FormDocument, id: string): FormDocument {
  return {
    ...doc,
    fieldGroup: mapField(doc.fieldGroup, id, (field) => {
      const { hide: _hide, ...expressions } = field.expressions ?? {};
      const { expressions: _old, ...rest } = field;
      return Object.keys(expressions).length ? { ...rest, expressions } : rest;
    }),
  };
}
