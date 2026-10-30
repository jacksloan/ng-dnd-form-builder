import { ChangeDetectionStrategy, Component, computed, inject, input, linkedSignal, untracked } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormlyFieldConfig, FormlyForm } from '@ngx-formly/core';
import { ConditionEditor } from './condition-editor';
import { coreSettings, errorMessageSetting } from './config';
import { isGroup } from './document';
import { BuilderStore } from './store';

/** Settings for one field. A new instance is created per field, so the form never mixes two fields' state. */
@Component({
  selector: 'dnd-settings-panel',
  imports: [ConditionEditor, FormlyForm, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (issues().length) {
      <ul class="dnd-issues">
        @for (issue of issues(); track issue.code) {
          <li>{{ m.issues[issue.code] }}</li>
        }
      </ul>
    }
    <form [formGroup]="form" (submit)="$event.preventDefault()">
      <formly-form [form]="form" [fields]="fields()" [model]="model()" (modelChange)="save($event)" />
    </form>
    <dnd-condition-editor [field]="field()" />
    @if (!group()) {
      <details class="dnd-advanced">
        <summary>{{ m.advanced }}</summary>
        <label class="dnd-label" [attr.for]="keyId()">{{ m.dataKey }}</label>
        <input
          class="dnd-input"
          type="text"
          [id]="keyId()"
          [value]="field().key"
          (change)="saveKey($any($event.target))"
        />
      </details>
    }
  `,
})
export class SettingsPanel {
  protected readonly store = inject(BuilderStore);
  protected readonly m = this.store.messages;

  readonly field = input.required<FormlyFieldConfig>();

  protected readonly form = new FormGroup({});
  protected readonly group = computed(() => isGroup(this.field()));
  protected readonly keyId = computed(() => `${this.store.uid}-key-${this.field().id}`);
  protected readonly issues = computed(() => this.store.issues().filter((issue) => issue.fieldId === this.field().id));

  /** Built once: Formly writes into its field configs, and rebuilding them would drop focus between settings. */
  protected readonly fields = computed((): FormlyFieldConfig[] => {
    const definition = untracked(() => this.store.definition(this.field()));
    const group = untracked(this.group);
    const validated = !group && definition !== undefined;
    const fields = [
      ...coreSettings(this.m, group),
      ...(definition?.settings ?? []),
      ...(validated ? [errorMessageSetting(this.m)] : []),
    ];
    return fields.map((field) => ({ ...field, props: { ...field.props } }));
  });

  /** Keeps the same object while its content is unchanged, so saving a setting doesn't rebuild the form. */
  protected readonly model = linkedSignal<Record<string, unknown>>(() => {
    const { showWhen: _showWhen, ...props } = this.field().props ?? {};
    return structuredClone(props);
  }, { equal: (a, b) => JSON.stringify(a) === JSON.stringify(b) });

  protected save(model: Record<string, unknown>): void {
    this.model.set(model);
    this.store.update(this.field().id!, { props: clean(model) });
  }

  protected saveKey(input: HTMLInputElement): void {
    const key = input.value.trim();
    if (key) this.store.update(this.field().id!, { key });
    else input.value = String(this.field().key ?? '');
  }
}

/** A cleared setting means "unset": Formly would otherwise treat an empty min or pattern as a real rule. */
function clean(model: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(model).map(([key, value]) => [key, key !== 'label' && (value === null || value === '') ? undefined : value]),
  );
}
