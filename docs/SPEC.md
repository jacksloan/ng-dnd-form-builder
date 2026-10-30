# ng-dnd-form-builder: v1 specification

Status: agreed, not yet built. All existing code is to be scrapped; only the idea carries over.

## 1. Product

An Angular library that lets non-technical people build forms by dragging fields onto a canvas, inside a host application. The output is a JSON document that is itself a valid Formly field, which the host stores and renders directly with [ngx-formly](https://formly.dev), with no code from this library on the page.

- **Delivery:** npm package `ng-dnd-form-builder`, showcased by a demo site on the existing GitHub Pages URL.
- **Primary user:** an end user of the host app, who never sees configuration. Developer details such as data keys sit under an "Advanced" section.
- **Integrator:** an Angular developer who embeds the component, stores the document, and registers any custom field types.

### Non-goals for v1

- Submission storage, a backend, or form hosting
- Collaboration or analytics
- Importing existing Formly configs
- Repeating sections and multi-step wizards
- Translating a form's own content into several languages
- Nested and/or condition logic, or an expression language

## 2. Technical baseline

| Area | Decision |
| --- | --- |
| Framework | Angular 22: standalone, zoneless, `@if`/`@for`, `input()`/`output()`/`model()` |
| Form engine | `@ngx-formly/core` 11, which requires Angular 22 or newer and brings RxJS as a peer dependency |
| Builder state | Plain signals; no NgRx |
| Drag and drop | `@angular/cdk/drag-drop` |
| Accessible UI | `@angular/aria` |
| Styling | Own default styles themed through CSS variables; no Material or Tailwind requirement |
| IDs | `crypto.randomUUID()` |
| Language and lint | Strict TypeScript, ESLint |
| Tests | Vitest for units, Playwright for end-to-end, axe for accessibility checks |
| Workspace | Plain Angular CLI workspace: `projects/ng-dnd-form-builder` and `projects/demo`; no Nx |
| CI | GitHub Actions for lint, tests, build and deploy; npm publish on tag |

Dropped from the old project: NgModules and SCAMs, RxJS as builder state, `uuid`, Karma, `@ngneat/edit-in-place`, `@ngneat/tailwind`.

Hosts choose their own Formly UI integration. Field rendering in Preview uses whatever the host registered; the demo uses `@ngx-formly/material`.

## 3. Public API

```ts
provideFormBuilder({
  fieldTypes: [/* added to the built-ins */],
  messages: {/* overrides for UI text and announcements */},
});
```

```html
<dnd-form-builder [(document)]="doc" (issues)="onIssues($event)" />
```

Also exported: `validateDocument(doc)` and the document types.

Hosts customise through a few CSS variables and named slots. The inner components and the store are not public. Hosts own persistence; the library contains no storage or HTTP code, and only the demo uses `localStorage`.

### Rendering a saved form

Rendering needs Formly only:

```ts
provideFormlyCore([withFormlyMaterial(), withFormlyFieldExpression()]);
```

```html
<formly-form [form]="form" [fields]="[doc]" [model]="model" />
```

Hosts must:

- **Enable the safe parser.** `withFormlyFieldExpression()` evaluates string expressions without `eval` or `new Function`, and has no function calls. Without it, Formly falls back to `new Function()`, so an untrusted document could run code, and a strict Content Security Policy blocks it anyway. The library can't enforce this on a page that doesn't use it, so the quick-start must show it prominently.
- **Pass a copy of the document.** Formly writes into the configs it renders, so the stored document must be cloned first.
- **Register a Formly UI and any custom types**, the normal Formly way.

## 4. Document format

**The document is a single JSON-serialisable `FormlyFieldConfig`:** a root group with no key. There is no separate format and no compile step. Everything the builder needs beyond Formly lives in `props`, which Formly leaves open for arbitrary keys.

```json
{
  "props": { "schemaVersion": 1 },
  "fieldGroup": [
    { "id": "f1", "key": "hasPet", "type": "checkbox",
      "props": { "label": "Do you have a pet?" } },
    { "id": "f2", "key": "petName", "type": "input",
      "props": {
        "type": "text",
        "label": "Pet name",
        "required": true,
        "showWhen": { "match": "all", "conditions": [
          { "field": "f1", "op": "equals", "value": true } ] }
      },
      "validation": { "messages": { "required": "Please name your pet" } },
      "expressions": { "hide": "!(model[\"hasPet\"] === true)" } }
  ]
}
```

```ts
type FormDocument = FormlyFieldConfig & {
  props: { schemaVersion: 1 };
  fieldGroup: FormlyFieldConfig[];
};

interface ShowWhen {
  match: 'all' | 'any';
  conditions: {
    field: string; // Formly `id` of the referenced field
    op: 'equals' | 'notEquals' | 'isEmpty' | 'isNotEmpty'
      | 'greaterThan' | 'lessThan';
    value?: unknown;
  }[];
}
```

- `id` is the stable identity that rules refer to.
- Documents contain only JSON values: no functions or observables.
- Builder details such as icons come from the field type registry and are not stored. A field's registry entry is found from its `type` and, for `input` variants, `props.type`.

The exact shape may be refined during the schema step; the rules below are the contract.

### Groups and keys

- Groups are layout only. Submitted data stays flat, such as `{ firstName, city }`, and moving a field between groups never changes the data shape.
- Keys are unique across the whole form.
- A key is generated from the first label ("First name" becomes `firstName`, then `firstName2` on a clash).
- Later label edits don't change the key, so saved answers stay valid. It can be edited under "Advanced".

### Versioning

- Documents carry an integer `props.schemaVersion`, checked on load.
- A document from a newer version shows a clear error and is not edited.
- No migration framework until v2 exists; v2 adds a plain `v1 → v2` function.

## 5. Field types

Built-in and custom types share one plain shape, and built-ins are included by default:

```ts
{
  type: 'rating',
  label: 'Rating',
  icon: '<svg>…</svg>',
  defaults: { props: { max: 5 } },
  settings: [/* FormlyFieldConfig[] */],
}
```

The settings panel is itself a Formly form, so there is no separate settings UI to write. Hosts register the actual Formly component for a custom type the normal Formly way.

**Built-in fields:** text, textarea, number, email, date, checkbox, radio, select, group. Date uses native `<input type="date">`, so it works with any Formly UI and needs no date library.

**Validation:** required, min/max, min/max length, pattern, and an optional custom error message.

File upload, signature, rich text and similar types are left to custom field types.

## 6. Conditions

- One `props.showWhen` per field, with one level of all/any.
- `props.showWhen` is what the rule editor reads. The builder regenerates `expressions.hide` from it on every change, including when a referenced key changes.
- Generated expressions use only syntax the safe parser supports. It has no method calls, which is why there is no `contains` operator.
- If a field's `expressions.hide` doesn't match its rule, or it has no rule, the editor shows "custom condition" and leaves it untouched.
- Hidden fields' values are cleared by Formly's `resetOnHide`, which defaults to true, so stale answers can't leak through.
- A rule on a group applies to everything inside it.
- A rule may refer to a field further down the form, so reordering doesn't break rules.
- The rule picker only offers fields that wouldn't create a cycle, and `validateDocument` also rejects cycles.
- Deleting a referenced field shows a confirmation listing its dependents, then removes those conditions. Undo restores everything.

## 7. State

`BuilderStore` is a component-scoped service holding one `signal<FormDocument>`, with `computed` selectors and pure command functions such as `addField` and `moveField`. Every interaction goes through a command; dragging is just one way to call it.

### Undo

- In memory and limited to the session, holding 50 previous documents.
- Ctrl/Cmd+Z and Shift+Z, plus toolbar buttons.
- A drag or a settings commit is one step, so typing a label is one step, not one per letter.
- History resets when the host passes in a different document. The builder's own emitted value doesn't trigger a reset.

## 8. Validation and trust

- **While editing:** invalid states are allowed. Issues show inline, such as a radio with no options, and the builder exposes them through `issues`. The host decides whether to allow publishing.
- **On load:** `validateDocument` runs on every incoming document, because that is a trust boundary. Structurally broken documents show an error state instead of rendering. It also flags any expression that doesn't match its rule or that the safe parser can't read.
- **Unknown field types:** kept and flagged, never dropped, so opening a form can't silently destroy data.
- **Output safety:** the builder renders labels as text, never HTML, and evaluates expressions only through the safe parser. Rendering pages depend on the host enabling that parser (section 3).

## 9. Interface

- **Layout:** three panes (palette, canvas, settings), plus an Edit/Preview toggle.
- **Canvas:** lightweight cards with icon, label and badges for required, conditional and issues. Real Formly fields appear only in Preview, so inputs don't fight with dragging.
- **Without dragging:** clicking a palette item adds the field after the current selection. Each card has a menu for move up, move down, move to group, duplicate and delete. These actions cover keyboard and touch use.
- **Screen readers:** a live region announces each change, such as "First name moved to position 2".
- **Narrow screens:** panes stack and settings open as a drawer. Editing must work on a phone; drag and drop isn't guaranteed there.

Keyboard and screen-reader support is a hard v1 requirement.

### Drag and drop

Use CDK nested connected lists. Palette items use the CDK drag preview and placeholder without touching list data, which replaces the old temporary-item trick.

Nested CDK drop lists have a reported problem where the outer list wins the drop, so this is proven first. A half-day spike must pass, with Playwright coverage:

- palette-to-group drops
- moves between groups
- three levels of nesting

If it fails, render the tree as one flat CDK list with indentation.

## 10. Internationalisation

All built-in UI text and announcements default to English and can be overridden through `provideFormBuilder({ messages })`, with no `@angular/localize` or Transloco dependency. Styles use CSS logical properties so right-to-left layouts work.

## 11. Release criteria for 1.0

- **Formly compatibility (hard requirement):** an integration test renders builder output in a plain `<formly-form>` with `withFormlyFieldExpression()` and no builder code on the page, covering every built-in field type, validation, conditions, group visibility and flat submitted data.
- **Unit tests:** store commands, `validateDocument` and expression generation.
- **End-to-end tests:** drag flows, a keyboard-only build of a full form, and automated axe checks.
- **Demo:** includes a host-registered custom field type and a Material preview.
- **Docs:** a short README with quick-start, API and document format.
- **Versioning:** the major version tracks Angular, supporting only the current Angular major. The peer range follows Formly's Angular requirement.

## 12. Build order

Start in this repo: tag the current state `legacy`, then remove the old code in a single "scrap" commit.

1. Schema and pure functions (`validateDocument`, expression generation), first confirming against the published Formly 11 package what has so far only been read in Formly's `main` branch and docs: the safe parser's syntax, keyless groups keeping data flat, `resetOnHide`, and `props.showWhen` having no side effects
2. Store and undo
3. Drag-and-drop spike
4. Canvas and palette
5. Settings
6. Conditions
7. Preview
8. Demo and release

## 13. Decisions to revisit

- **Formly:** the rendered forms run on Reactive Forms, not Signal Forms. Revisit if Formly falls behind or a real need for Signal Forms appears.
- **Composable builder parts:** kept private for now; expose them if someone asks.
