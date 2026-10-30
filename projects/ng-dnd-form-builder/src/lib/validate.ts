import { hasConditionCycle, hasCustomCondition } from './conditions';
import { allFields, FormDocument, isGroup, SCHEMA_VERSION, showWhenOf } from './document';

export interface DocumentIssue {
  /** Absent for problems with the document as a whole. */
  fieldId?: string;
  code:
    | 'invalid-document'
    | 'newer-version'
    | 'not-json'
    | 'duplicate-id'
    | 'missing-key'
    | 'invalid-key'
    | 'duplicate-key'
    | 'missing-options'
    | 'missing-label'
    | 'unknown-type'
    | 'broken-condition'
    | 'condition-cycle'
    | 'custom-condition'
    | 'unsafe-expression';
  /** Fatal issues stop the builder from opening the document. */
  fatal: boolean;
}

const KEY = /^[A-Za-z_$][\w$]*$/;
/** Tokens the safe parser accepts. Anything else, including a function call, is rejected. */
const SAFE_TOKEN =
  /\s+|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\d+(?:\.\d+)?|[A-Za-z_$][\w$]*|\?\.|===|!==|==|!=|<=|>=|&&|\|\||[!<>+\-*/%?:.[\]]|\(/y;

export function isSafeExpression(expression: string): boolean {
  SAFE_TOKEN.lastIndex = 0;
  let previous = '';
  while (SAFE_TOKEN.lastIndex < expression.length) {
    const start = SAFE_TOKEN.lastIndex;
    const match = SAFE_TOKEN.exec(expression);
    if (!match) {
      if (expression[start] === ')') {
        SAFE_TOKEN.lastIndex = start + 1;
        previous = ')';
        continue;
      }
      return false;
    }
    const token = match[0];
    if (token === '(' && /^[\w$)\]"']/.test(previous)) return false;
    if (token.trim()) previous = token;
  }
  return true;
}

/** Everywhere Formly accepts a string it will evaluate, not just the `hide` the builder writes. */
const EXPRESSION_SLOTS = ['expressions', 'expressionProperties', 'hideExpression', 'validators', 'asyncValidators'] as const;

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  return value && typeof value === 'object' ? Object.values(value).flatMap(strings) : [];
}

function isJson(value: unknown): boolean {
  if (value === null || ['string', 'number', 'boolean'].includes(typeof value)) return true;
  if (Array.isArray(value)) return value.every(isJson);
  if (typeof value !== 'object') return false;
  const proto = Object.getPrototypeOf(value);
  return (proto === Object.prototype || proto === null) && Object.values(value as object).every((v) => v === undefined || isJson(v));
}

/**
 * Checks a document at the trust boundary. Fatal issues mean it can't be opened; the rest are shown inline
 * and left for the host to act on. `knownTypes` omitted skips the unknown-type check.
 */
export function validateDocument(doc: unknown, knownTypes?: ReadonlySet<string>): DocumentIssue[] {
  const candidate = doc as FormDocument | null;
  const version = candidate?.props?.schemaVersion;
  if (typeof candidate !== 'object' || candidate === null || !Array.isArray(candidate.fieldGroup) || !Number.isInteger(version)) {
    return [{ code: 'invalid-document', fatal: true }];
  }
  if (version! > SCHEMA_VERSION) return [{ code: 'newer-version', fatal: true }];
  if (!isJson(candidate)) return [{ code: 'not-json', fatal: true }];

  const issues: DocumentIssue[] = [];
  const fields = allFields(candidate);
  if (fields.some((f) => typeof f !== 'object' || f === null)) return [{ code: 'invalid-document', fatal: true }];

  const ids = new Set<string>();
  const keys = new Set<unknown>();
  const byId = new Map(fields.map((f) => [f.id, f]));
  for (const field of fields) {
    const fieldId = field.id;
    const add = (code: DocumentIssue['code'], fatal = false) => issues.push({ fieldId, code, fatal });

    if (typeof fieldId !== 'string' || ids.has(fieldId)) add('duplicate-id', true);
    if (fieldId) ids.add(fieldId);

    if (isGroup(field)) {
      if (field.key !== undefined) add('invalid-key');
    } else {
      if (field.key === undefined) add('missing-key');
      else if (typeof field.key !== 'string' || !KEY.test(field.key)) add('invalid-key');
      else if (keys.has(field.key)) add('duplicate-key');
      keys.add(field.key);
      if (knownTypes && typeof field.type === 'string' && !knownTypes.has(field.type)) add('unknown-type');
      if (!field.props?.label) add('missing-label');
      if ((field.type === 'radio' || field.type === 'select') && !(field.props?.options as unknown[] | undefined)?.length) {
        add('missing-options');
      }
    }

    if (EXPRESSION_SLOTS.some((slot) => strings(field[slot]).some((text) => !isSafeExpression(text)))) {
      add('unsafe-expression');
    }
    if (hasCustomCondition(field, candidate)) add('custom-condition');
    if (showWhenOf(field)?.conditions.some((c) => byId.get(c.field)?.key === undefined)) add('broken-condition');
  }
  if (hasConditionCycle(candidate)) issues.push({ code: 'condition-cycle', fatal: false });
  return issues;
}
