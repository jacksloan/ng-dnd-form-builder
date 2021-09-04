import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';

@Component({
  selector: 'dnd-form-preview',
  template: `
    <p *ngIf="fields.length < 1">
      Add inputs using the form builder to enable form preview
    </p>

    <form [formGroup]="form" *ngIf="form && model && options">
      <formly-form
        [form]="form"
        [model]="model"
        [fields]="fields"
        [options]="options"
      ></formly-form>
    </form>

    <button mat-raised-button color="accent" (click)="logFormFields()">
      Log Form
    </button>
  `,
  styles: [
    `
      :host {
        @apply block bg-white p-4 shadow-md rounded-md;
        width: 36rem;
      }
    `,
  ],
})
export class DndFormPreviewComponent implements OnChanges {
  @Input() fields: FormlyFieldConfig[] = [];
  options: FormlyFormOptions = {};
  form = new FormGroup({});
  model = {};

  ngOnChanges(c: SimpleChanges) {
    if (c.fields) {
      // huge wtf - if we don't stringify & parse
      // multiple datepickers only change the last datepicker in the list without this?
      this.fields = JSON.parse(JSON.stringify(c.fields.currentValue));
    }
  }

  logFormFields() {
    console.log({
      model: this.model,
      fields: this.fields,
    });
  }
}
