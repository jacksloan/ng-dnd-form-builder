import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormlyFieldConfig, FormlyForm, provideFormlyCore, withFormlyFieldExpression } from '@ngx-formly/core';
import { withFormlyMaterial } from '@ngx-formly/material';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addField, setShowWhen, updateField } from './commands';
import { createDocument, FormDocument } from './document';

/** A host page: Formly only, and the saved document as plain JSON. */
@Component({
  imports: [FormlyForm, ReactiveFormsModule],
  template: `<form [formGroup]="form"><formly-form [form]="form" [fields]="fields" [model]="model()" /></form>`,
})
class HostPage {
  form = new FormGroup({});
  fields: FormlyFieldConfig[] = [];
  model = signal<Record<string, unknown>>({});
}

const field = (id: string, key: string, type: string, props: Record<string, unknown> = {}) => ({
  id, key, type, props: { label: key, ...props },
});

async function render(doc: FormDocument, model: Record<string, unknown> = {}) {
  const fixture = TestBed.createComponent(HostPage);
  const json: FormDocument = JSON.parse(JSON.stringify(doc));
  fixture.componentInstance.fields = [json];
  fixture.componentInstance.model.set(model);
  await fixture.whenStable();
  const page = fixture.componentInstance;
  return {
    fixture,
    page,
    el: fixture.nativeElement as HTMLElement,
    stable: () => fixture.whenStable(),
    set: async (values: Record<string, unknown>) => {
      for (const [k, v] of Object.entries(values)) {
        page.form.get(k)!.setValue(v);
      }
      await fixture.whenStable();
    },
  };
}

describe('saved documents in a plain <formly-form>', () => {
  const evaluated: string[][] = [];

  beforeEach(() => {
    evaluated.length = 0;
    TestBed.configureTestingModule({
      providers: [provideFormlyCore([...withFormlyMaterial(), withFormlyFieldExpression()])],
    });
    // Angular's test compiler also uses Function, so only Formly's expression arguments count.
    vi.stubGlobal('Function', new Proxy(Function, {
      construct(target, args: string[]) {
        if (args[0] === 'model') evaluated.push(args);
        return Reflect.construct(target, args);
      },
      apply(target, thisArg, args: string[]) {
        if (args[0] === 'model') evaluated.push(args);
        return Reflect.apply(target, thisArg, args);
      },
    }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('renders every built-in field type', async () => {
    let doc = createDocument();
    const options = [{ label: 'One', value: 'one' }];
    const fields = [
      field('t', 'text', 'input', { type: 'text' }),
      field('a', 'area', 'textarea'),
      field('n', 'num', 'input', { type: 'number' }),
      field('e', 'mail', 'input', { type: 'email' }),
      field('d', 'date', 'input', { type: 'date' }),
      field('c', 'check', 'checkbox'),
      field('r', 'radio', 'radio', { options }),
      field('s', 'sel', 'select', { options }),
    ];
    fields.forEach((f, i) => (doc = addField(doc, f, null, i)));
    const { el, page } = await render(doc);
    expect(el.querySelector('input[type=text]')).toBeTruthy();
    expect(el.querySelector('textarea')).toBeTruthy();
    expect(el.querySelector('input[type=number]')).toBeTruthy();
    expect(el.querySelector('input[type=email]')).toBeTruthy();
    expect(el.querySelector('input[type=date]')).toBeTruthy();
    expect(el.querySelector('input[type=checkbox]')).toBeTruthy();
    expect(el.querySelector('input[type=radio]')).toBeTruthy();
    expect(el.querySelector('mat-select')).toBeTruthy();
    expect(Object.keys(page.form.controls).sort()).toEqual(fields.map((f) => f.key).sort());
  });

  it('applies validation props and custom messages', async () => {
    let doc = addField(createDocument(), field('n', 'age', 'input', { type: 'number', required: true, min: 18 }), null, 0);
    doc = updateField(doc, 'n', { props: { errorMessage: 'Too young' } });
    const { page, set } = await render(doc);
    expect(page.form.valid).toBe(false);
    await set({ age: 5 });
    expect(page.form.get('age')!.errors).toHaveProperty('min');
    await set({ age: 21 });
    expect(page.form.valid).toBe(true);
    expect(doc.fieldGroup[0].validation!.messages!['min']).toBe('Too young');
  });

  it('keeps data flat through nested groups', async () => {
    let doc = addField(createDocument(), { id: 'g', props: { label: 'G' }, fieldGroup: [] }, null, 0);
    doc = addField(doc, { id: 'h', props: { label: 'H' }, fieldGroup: [] }, 'g', 0);
    doc = addField(doc, field('c', 'city', 'input'), 'h', 0);
    const { page, set } = await render(doc);
    await set({ city: 'Oslo' });
    expect(page.form.value).toEqual({ city: 'Oslo' });
  });

  it('shows and hides fields without new Function, and clears hidden values', async () => {
    let doc = addField(createDocument(), field('a', 'pet', 'input'), null, 0);
    doc = addField(doc, field('b', 'name', 'input'), null, 1);
    doc = setShowWhen(doc, 'b', { match: 'all', conditions: [{ field: 'a', op: 'equals', value: 'say "yes"' }] });
    const { page, set } = await render(doc);
    expect(page.form.get('name')).toBeNull();
    await set({ pet: 'say "yes"' });
    expect(page.form.get('name')).not.toBeNull();
    await set({ name: 'Rex' });
    expect(page.form.value).toEqual({ pet: 'say "yes"', name: 'Rex' });
    await set({ pet: 'no' });
    expect(page.form.get('name')).toBeNull();
    expect(page.form.value).toEqual({ pet: 'no' });
    expect(page.model()['name']).toBeUndefined();
    expect(evaluated).toEqual([]);
  });

  it('falls back to new Function when the host omits withFormlyFieldExpression', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideFormlyCore(withFormlyMaterial())] });
    let doc = addField(createDocument(), field('a', 'pet', 'input'), null, 0);
    doc = addField(doc, field('b', 'name', 'input'), null, 1);
    doc = setShowWhen(doc, 'b', { match: 'all', conditions: [{ field: 'a', op: 'isNotEmpty' }] });
    await render(doc);
    expect(evaluated.length).toBeGreaterThan(0);
  });

  it('a rule on a group hides everything inside it', async () => {
    let doc = addField(createDocument(), field('a', 'show', 'input'), null, 0);
    doc = addField(doc, { id: 'g', props: { label: 'G' }, fieldGroup: [] }, null, 1);
    doc = addField(doc, field('c', 'inner', 'input'), 'g', 0);
    doc = setShowWhen(doc, 'g', { match: 'any', conditions: [{ field: 'a', op: 'isNotEmpty' }] });
    const { page, set } = await render(doc);
    expect(page.form.get('inner')).toBeNull();
    await set({ show: 'x' });
    expect(page.form.get('inner')).not.toBeNull();
    await set({ inner: 'v' });
    await set({ show: '' });
    expect(page.form.get('inner')).toBeNull();
    expect(page.form.value).toEqual({ show: '' });
  });

  it('a rule may refer to a field further down', async () => {
    let doc = addField(createDocument(), field('a', 'first', 'input'), null, 0);
    doc = addField(doc, field('b', 'later', 'input', { type: 'number' }), null, 1);
    doc = setShowWhen(doc, 'a', { match: 'all', conditions: [{ field: 'b', op: 'greaterThan', value: 3 }] });
    const { page, set } = await render(doc);
    expect(page.form.get('first')).toBeNull();
    await set({ later: 4 });
    expect(page.form.get('first')).not.toBeNull();
  });
});
