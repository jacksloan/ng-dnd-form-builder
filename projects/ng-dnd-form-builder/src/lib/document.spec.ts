import { describe, expect, it } from 'vitest';
import { addField, duplicateField, moveField, removeField, setShowWhen, toKey, updateField } from './commands';
import { conditionCandidates, hasConditionCycle, hideExpression } from './conditions';
import { createDocument, findField, FormDocument } from './document';
import { isSafeExpression, validateDocument } from './validate';

const text = (id: string, key: string) => ({ id, key, type: 'input', props: { type: 'text', label: key } });
const group = (id: string) => ({ id, props: { label: id }, fieldGroup: [] });

function sample(): FormDocument {
  let doc = createDocument();
  doc = addField(doc, text('a', 'a'), null, 0);
  doc = addField(doc, text('b', 'b'), null, 1);
  doc = addField(doc, group('g'), null, 2);
  return addField(doc, text('c', 'c'), 'g', 0);
}
const equalsA = { match: 'all' as const, conditions: [{ field: 'a', op: 'equals' as const, value: 'x"y' }] };

describe('commands', () => {
  it('moves fields between levels and refuses to move a group into itself', () => {
    let doc = moveField(sample(), 'a', 'g', 1);
    expect(doc.fieldGroup.map((f) => f.id)).toEqual(['b', 'g']);
    expect(findField(doc, 'g')!.fieldGroup!.map((f) => f.id)).toEqual(['c', 'a']);
    doc = addField(doc, group('inner'), 'g', 0);
    expect(moveField(doc, 'g', 'inner', 0)).toBe(doc);
    expect(moveField(doc, 'g', 'g', 0)).toBe(doc);
  });

  it('leaves the original untouched', () => {
    const doc = sample();
    const before = structuredClone(doc);
    moveField(doc, 'a', 'g', 0);
    removeField(doc, 'g');
    expect(doc).toEqual(before);
  });

  it('generates a key from the first label, then freezes it', () => {
    let doc = addField(createDocument(), { id: 'f', key: 'text', type: 'input', props: { label: 'Text' } }, null, 0);
    doc = addField(doc, { id: 'other', key: 'firstName', type: 'input', props: { label: 'x' } }, null, 1);
    doc = updateField(doc, 'f', { props: { label: 'First name' } }, 'Text');
    expect(findField(doc, 'f')!.key).toBe('firstName2');
    doc = updateField(doc, 'f', { props: { label: 'Given name' } }, 'Text');
    expect(findField(doc, 'f')!.key).toBe('firstName2');
    doc = updateField(doc, 'f', { key: 'custom' }, 'Text');
    expect(findField(doc, 'f')!.key).toBe('custom');
  });

  it('makes keys that always start validly', () => {
    expect(toKey('First name!')).toBe('firstName');
    expect(toKey('2nd address')).toBe('field2ndAddress');
    expect(toKey('日本語')).toBe('field');
  });

  it('applies one error message to every validator and removes it again', () => {
    let doc = updateField(sample(), 'a', { props: { errorMessage: 'Nope' } });
    expect(findField(doc, 'a')!.validation!.messages!['required']).toBe('Nope');
    expect(findField(doc, 'a')!.validation!.messages!['pattern']).toBe('Nope');
    doc = updateField(doc, 'a', { props: { errorMessage: '' } });
    expect(findField(doc, 'a')!.validation).toBeUndefined();
  });

  it('removing a referenced field strips the conditions and expression', () => {
    let doc = setShowWhen(sample(), 'b', equalsA);
    expect(findField(doc, 'b')!.expressions!['hide']).toContain('model["a"]');
    doc = removeField(doc, 'a');
    expect(findField(doc, 'b')!.props!['showWhen']).toBeUndefined();
    expect(findField(doc, 'b')!.expressions).toBeUndefined();
  });

  it('regenerates expressions when a referenced key changes', () => {
    let doc = setShowWhen(sample(), 'b', equalsA);
    doc = updateField(doc, 'a', { key: 'renamed' });
    expect(findField(doc, 'b')!.expressions!['hide']).toContain('model["renamed"]');
  });

  it('leaves custom conditions alone until a rule replaces them', () => {
    let doc = addField(createDocument(), text('a', 'a'), null, 0);
    doc = addField(doc, { ...text('z', 'z'), expressions: { hide: 'model.a > 1' } }, null, 1);
    doc = updateField(doc, 'a', { key: 'k' });
    expect(findField(doc, 'z')!.expressions!['hide']).toBe('model.a > 1');
    doc = setShowWhen(doc, 'z', { match: 'all', conditions: [{ field: 'a', op: 'isEmpty' }] });
    expect(findField(doc, 'z')!.expressions!['hide']).toContain('model["k"]');
  });

  it('duplicates groups with new ids and keys, and rules follow the copies', () => {
    let doc = createDocument();
    doc = addField(doc, group('g'), null, 0);
    doc = addField(doc, text('p', 'p'), 'g', 0);
    doc = addField(doc, text('q', 'q'), 'g', 1);
    doc = setShowWhen(doc, 'q', { match: 'all', conditions: [{ field: 'p', op: 'isNotEmpty' }] });
    let n = 0;
    doc = duplicateField(doc, 'g', () => `new${n++}`);
    const copy = doc.fieldGroup[1];
    expect(copy.fieldGroup!.map((f) => f.key)).toEqual(['p2', 'q2']);
    expect(copy.fieldGroup![1].expressions!['hide']).toContain('model["p2"]');
  });
});

describe('conditions', () => {
  it('excludes fields that would create a cycle', () => {
    let doc = setShowWhen(sample(), 'b', equalsA);
    expect(conditionCandidates(doc, 'a').map((f) => f.id)).toEqual(['c']);
    // a group's rule can't use a field inside it
    expect(conditionCandidates(doc, 'g').map((f) => f.id)).toEqual(['a', 'b']);
    doc = setShowWhen(doc, 'a', { match: 'all', conditions: [{ field: 'b', op: 'isEmpty' }] });
    expect(hasConditionCycle(doc)).toBe(true);
  });

  it('allows a rule to refer further down the form', () => {
    expect(conditionCandidates(sample(), 'a').map((f) => f.id)).toEqual(['b', 'c']);
  });

  it('generates only syntax the safe parser accepts', () => {
    const doc = sample();
    for (const op of ['equals', 'notEquals', 'isEmpty', 'isNotEmpty', 'greaterThan', 'lessThan'] as const) {
      const hide = hideExpression({ match: 'any', conditions: [{ field: 'a', op, value: 'x"y' }, { field: 'b', op, value: 2 }] }, doc)!;
      expect(isSafeExpression(hide), hide).toBe(true);
    }
  });
});

describe('validateDocument', () => {
  const codes = (doc: unknown) => validateDocument(doc).map((i) => i.code);

  it('rejects structurally broken and newer documents', () => {
    expect(codes(null)).toEqual(['invalid-document']);
    expect(codes({ fieldGroup: [] })).toEqual(['invalid-document']);
    expect(codes({ props: { schemaVersion: 99 }, fieldGroup: [] })).toEqual(['newer-version']);
    expect(codes({ props: { schemaVersion: 1 }, fieldGroup: [{ id: 'a', hooks: { onInit: () => 1 } }] })).toEqual(['not-json']);
    expect(validateDocument({ props: { schemaVersion: 1 }, fieldGroup: [{ key: 'x' }] })[0].fatal).toBe(true);
  });

  it('reports fixable problems without blocking', () => {
    const doc = addField(addField(createDocument(), { id: 'r', key: 'x', type: 'radio', props: { label: 'R' } }, null, 0), text('t', 'x'), null, 1);
    expect(codes(doc)).toEqual(['missing-options', 'duplicate-key']);
    expect(validateDocument(doc).every((i) => !i.fatal)).toBe(true);
  });

  it('flags unknown types without losing them', () => {
    const doc = addField(createDocument(), { id: 'u', key: 'u', type: 'mystery', props: { label: 'U' } }, null, 0);
    expect(validateDocument(doc, new Set(['input'])).map((i) => i.code)).toEqual(['unknown-type']);
    expect(findField(doc, 'u')).toBeTruthy();
  });

  it('flags expressions the safe parser would not run', () => {
    expect(isSafeExpression('fetch("https://evil.example")')).toBe(false);
    expect(isSafeExpression('model.constructor.constructor("x")()')).toBe(false);
    expect(isSafeExpression('`a`')).toBe(false);
    expect(isSafeExpression('(model.a > 1) && !(model.b === "(x)")')).toBe(true);
    const doc = addField(createDocument(), { ...text('e', 'e'), expressions: { hide: 'alert(1)' } }, null, 0);
    expect(codes(doc)).toEqual(['unsafe-expression', 'custom-condition']);
  });
});
