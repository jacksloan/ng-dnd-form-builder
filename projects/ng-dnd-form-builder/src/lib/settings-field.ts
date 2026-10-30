import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FieldType, FieldTypeConfig, FormlyAttributes } from '@ngx-formly/core';

interface Option {
  label: string;
  value: unknown;
}

/** The control used by the built-in settings, so they look the same whichever Formly UI the host has registered. */
@Component({
  selector: 'dnd-settings-field',
  imports: [ReactiveFormsModule, FormlyAttributes],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (props['control']) {
      @case ('checkbox') {
        <label class="dnd-check">
          <input type="checkbox" [formControl]="formControl" [formlyAttributes]="field" />
          {{ props.label }}
        </label>
      }
      @case ('number') {
        <label class="dnd-label" [attr.for]="id">{{ props.label }}</label>
        <input class="dnd-input" type="number" [id]="id" [formControl]="formControl" [formlyAttributes]="field" />
      }
      @case ('options') {
        <label class="dnd-label" [attr.for]="id">{{ props.label }}</label>
        <textarea
          class="dnd-input"
          rows="4"
          [id]="id"
          [value]="optionsText()"
          (change)="setOptions($any($event.target).value)"
        ></textarea>
      }
      @default {
        <label class="dnd-label" [attr.for]="id">{{ props.label }}</label>
        <input class="dnd-input" type="text" [id]="id" [formControl]="formControl" [formlyAttributes]="field" />
      }
    }
  `,
})
export class SettingsField extends FieldType<FieldTypeConfig> {
  protected optionsText(): string {
    return ((this.formControl.value as Option[] | null) ?? []).map((option) => option.label).join('\n');
  }

  protected setOptions(text: string): void {
    const existing = (this.formControl.value as Option[] | null) ?? [];
    const options = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((label) => existing.find((option) => option.label === label) ?? { label, value: label });
    this.formControl.setValue(options);
  }
}
