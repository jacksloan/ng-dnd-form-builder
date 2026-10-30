import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FieldType, FieldTypeConfig } from '@ngx-formly/core';

/** A custom field type: a normal Formly component that the builder knows nothing about. */
@Component({
  selector: 'app-rating-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fieldset class="rating">
      <legend>{{ props.label }}</legend>
      @for (star of stars(); track star) {
        <label>
          <input type="radio" [name]="id" [value]="star" [checked]="formControl.value === star" (change)="formControl.setValue(star)" />
          {{ star }}★
        </label>
      }
    </fieldset>
  `,
  styles: `
    .rating { display: flex; gap: 12px; margin: 0 0 16px; }
  `,
})
export class RatingField extends FieldType<FieldTypeConfig> {
  protected stars(): number[] {
    return Array.from({ length: Number(this.props['max'] ?? 5) }, (_, i) => i + 1);
  }
}
