import { FormlyFieldConfig } from '@ngx-formly/core';
import { allFields, Condition, FormDocument, showWhenOf, ShowWhen, walkFields } from './document';

function conditionExpression(condition: Condition, keys: ReadonlyMap<string, string>): string | null {
  const key = keys.get(condition.field);
  if (!key) return null;
  const ref = `model[${JSON.stringify(key)}]`;
  const value = JSON.stringify(condition.value ?? null);
  const empty = `(${ref} === undefined || ${ref} === null || ${ref} === "")`;
  switch (condition.op) {
    case 'equals':
      return `${ref} === ${value}`;
    case 'notEquals':
      return `${ref} !== ${value}`;
    case 'isEmpty':
      return empty;
    case 'isNotEmpty':
      return `!${empty}`;
    case 'greaterThan':
      return `${ref} > ${value}`;
    case 'lessThan':
      return `${ref} < ${value}`;
  }
}

/** The Formly `hide` expression for a rule, using only syntax the safe parser supports. */
export function hideExpression(showWhen: ShowWhen, doc: FormDocument): string | null {
  const keys = new Map<string, string>();
  for (const field of allFields(doc)) {
    if (field.id && typeof field.key === 'string') keys.set(field.id, field.key);
  }
  const parts = showWhen.conditions.map((condition) => conditionExpression(condition, keys));
  if (parts.length === 0 || parts.includes(null)) return null;
  return `!(${parts.map((part) => `(${part})`).join(showWhen.match === 'all' ? ' && ' : ' || ')})`;
}

/** True when `expressions.hide` is not what the field's rule generates, so the builder must not touch it. */
export function hasCustomCondition(field: FormlyFieldConfig, doc: FormDocument): boolean {
  const hide = field.expressions?.['hide'];
  if (hide === undefined) return false;
  const showWhen = showWhenOf(field);
  return !showWhen || hide !== hideExpression(showWhen, doc);
}

/** Field id -> ids it depends on: its rule's fields, plus its parent group because a hidden group hides it. */
function dependencyGraph(doc: FormDocument): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>();
  walkFields(doc.fieldGroup, (field, parent) => {
    if (!field.id) return;
    const deps = new Set(showWhenOf(field)?.conditions.map((c) => c.field) ?? []);
    if (parent?.id) deps.add(parent.id);
    graph.set(field.id, deps);
  });
  return graph;
}

function dependsOn(graph: Map<string, Set<string>>, from: string, target: string): boolean {
  const seen = new Set<string>();
  const stack = [from];
  while (stack.length) {
    const id = stack.pop()!;
    if (id === target) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    stack.push(...(graph.get(id) ?? []));
  }
  return false;
}

/** Fields a rule on `fieldId` may refer to: keyed fields that wouldn't create a cycle. */
export function conditionCandidates(doc: FormDocument, fieldId: string): FormlyFieldConfig[] {
  const graph = dependencyGraph(doc);
  return allFields(doc).filter(
    (field) =>
      field.id && field.key !== undefined && field.id !== fieldId && !dependsOn(graph, field.id, fieldId),
  );
}

export function hasConditionCycle(doc: FormDocument): boolean {
  const graph = dependencyGraph(doc);
  return [...graph.entries()].some(([id, deps]) =>
    [...deps].some((dep) => dependsOn(graph, dep, id)),
  );
}

/** Fields whose rule refers to any of the given ids. */
export function dependentsOf(doc: FormDocument, ids: ReadonlySet<string>): FormlyFieldConfig[] {
  return allFields(doc).filter(
    (field) =>
      field.id !== undefined &&
      !ids.has(field.id) &&
      showWhenOf(field)?.conditions.some((condition) => ids.has(condition.field)),
  );
}
