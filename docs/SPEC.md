# ng-dnd-form-builder: v1 specification

Status: agreed, not yet built. All existing code is to be scrapped; only the idea carries over.

## 1. Product

An Angular library that lets non-technical people build forms by dragging fields onto a canvas, inside a host application. The output is a JSON document that the host stores and renders with [ngx-formly](https://formly.dev).

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

Also exported: `toFormly(doc)`, `validateDocument(doc)` and the document types.

Hosts customise through a few CSS variables and named slots. The inner components and the store are not public. Hosts own persistence; the library contains no storage or HTTP code, and only the demo uses `localStorage`.

## 4. Document format

The document is the source of truth. It is our own format because a Formly config can't round-trip through the editor: Formly conditions are either functions, which can't be saved, or strings, which it evaluates as code.

```ts
interface FormDocument {
  version: 1;
  fields: FieldNode[];
}

interface FieldNode {
  id: string;            // stable identity; rules refer to this
  type: string;          // built-in or custom type, or 'group'
  key?: string;          // data key; absent on groups
  props: Record<string, unknown>; // label, placeholder, options, min, max...
  validation?: { message?: string };
  showWhen?: ShowWhen;
  fields?: FieldNode[];  // groups only
}

interface ShowWhen {
  match: 'all' | 'any';
  conditions: {
    field: string; // FieldNode id
    op: 'equals' | 'notEquals' | 'isEmpty' | 'isNotEmpty'
      | 'greaterThan' | 'lessThan' | 'contains';
    value?: unknown;
  }[];
}
```

The exact field shape may be refined while building the schema step; the rules below are the contract.

### Groups and keys

- Groups are layout only. Submitted data stays flat, such as `{ firstName, city }`, and moving a field between groups never changes the data shape.
- Keys are unique across the whole form.
- A key is generated from the first label ("First name" becomes `firstName`, then `firstName2` on a clash).
- Later label edits don't change the key, so saved answers stay valid. It can be edited under "Advanced".

### Versioning

- Documents carry an integer `version`, checked on load.
- A document from a newer version shows a clear error and is not edited.
- No migration framework until v2 exists; v2 adds a plain `v1 → v2` function.

### `toFormly(doc)`

A pure function that compiles a document to `FormlyFieldConfig[]`.

- Outputs allowed properties only.
- Compiles `showWhen` to functions; never emits expression strings.
- Removes hidden fields' values from the submitted data, so stale answers can't leak through.

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

- One `showWhen` per field, with one level of all/any.
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
- **On load:** `validateDocument` runs on every incoming document, because that is a trust boundary. Structurally broken documents show an error state instead of rendering.
- **Unknown field types:** kept and flagged, never dropped, so opening a form can't silently destroy data.
- **Output safety:** labels are never rendered as HTML, and no document content is evaluated as code.

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

- **Unit tests:** store commands, `toFormly`, `validateDocument` and rule evaluation.
- **End-to-end tests:** drag flows, a keyboard-only build of a full form, and automated axe checks.
- **Demo:** includes a host-registered custom field type and a Material preview.
- **Docs:** a short README with quick-start, API and document format.
- **Versioning:** the major version tracks Angular, supporting only the current Angular major. The peer range follows Formly's Angular requirement.

## 12. Build order

Start in this repo: tag the current state `legacy`, then remove the old code in a single "scrap" commit.

1. Schema and pure functions (`validateDocument`, `toFormly`, rule evaluation)
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
