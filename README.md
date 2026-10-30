# ng-dnd-form-builder

Drag-and-drop form builder for Angular. What it saves is a plain [ngx-formly](https://formly.dev) field, so your pages render saved forms with Formly alone.

[Demo](https://jacksloan.github.io/ng-dnd-form-builder) · [Specification](docs/SPEC.md)

Requires Angular 22 and `@ngx-formly/core` 11.

## Quick start

```bash
npm install ng-dnd-form-builder @angular/cdk @angular/aria @ngx-formly/core
```

You also need a Formly UI. This example uses `@ngx-formly/material`.

```ts
provideFormlyCore([...withFormlyMaterial(), withFormlyFieldExpression()]),
provideFormBuilder(),
```

```ts
@Component({
  imports: [FormBuilder],
  template: `<dnd-form-builder [(document)]="form" (issues)="issues.set($event)" />`,
})
export class EditForm {
  form = signal<FormDocument | undefined>(undefined); // load and save this yourself
  issues = signal<DocumentIssue[]>([]);
}
```

## Rendering a saved form

No code from this library is needed on the page:

```ts
// Formly writes into what it renders, so give it a copy.
fields = [structuredClone(savedForm)];
```

```html
<form [formGroup]="form"><formly-form [form]="form" [fields]="fields" [model]="model" /></form>
```

> [!IMPORTANT]
> Every page that renders a saved form must use `withFormlyFieldExpression()`. Without it, Formly evaluates each condition with `Function()`, so a document from an untrusted source could run code, and a strict Content Security Policy would block the form.

If documents come from somewhere you don't fully control, run `validateDocument(doc)` first. Refuse any with a `fatal` issue or an `unsafe-expression` code.

## API

| Export | Purpose |
| --- | --- |
| `<dnd-form-builder [(document)] (issues)>` | The builder. An empty `document` starts a new form. `issues` reports what's wrong, and you decide whether to allow publishing. |
| `provideFormBuilder({ fieldTypes, messages })` | Adds custom field types and overrides UI text. |
| `validateDocument(doc, knownTypes?)` | Checks a document, returning a list of `DocumentIssue`. |
| `createDocument()` | Returns an empty document. |

**Slots:** `[dndToolbar]` adds toolbar content and `[dndEmpty]` replaces the empty canvas message.

**Theming:** set `--dnd-bg`, `--dnd-surface`, `--dnd-text`, `--dnd-muted`, `--dnd-border`, `--dnd-accent`, `--dnd-accent-text`, `--dnd-danger`, `--dnd-radius` and `--dnd-gap` on `dnd-form-builder`.

### Custom field types

Register the component with Formly as usual, then tell the builder about it:

```ts
provideFormlyCore([...withFormlyMaterial(), withFormlyFieldExpression(), { types: [{ name: 'rating', component: RatingField }] }]),
provideFormBuilder({
  fieldTypes: [{
    type: 'rating',
    label: 'Rating',
    icon: '<svg>…</svg>',
    defaults: { props: { max: 5 } },
    settings: [/* FormlyFieldConfig[] bound to the field's props */],
  }],
}),
```

## Document format

```json
{
  "props": { "schemaVersion": 1 },
  "fieldGroup": [
    { "id": "f1", "key": "hasPet", "type": "checkbox", "props": { "label": "Do you have a pet?" } },
    {
      "id": "f2", "key": "petName", "type": "input",
      "props": {
        "type": "text", "label": "Pet name",
        "showWhen": { "match": "all", "conditions": [{ "field": "f1", "op": "equals", "value": true }] }
      },
      "expressions": { "hide": "!((model[\"hasPet\"] === true))" }
    }
  ]
}
```

- Groups are layout only, so submitted data stays flat.
- `props.showWhen` is the editable rule. The builder regenerates `expressions.hide` from it. A `hide` written by hand is kept as a custom condition.
- A group's label appears in the builder only, because Formly doesn't render labels for groups. Add a Formly wrapper if you want a visible heading.

## Development

```bash
npm start
```
```bash
npm test
```
```bash
npm run e2e
```
```bash
npm run lint
```
```bash
npm run build
```
