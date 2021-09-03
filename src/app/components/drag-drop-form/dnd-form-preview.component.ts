import { Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { v4 } from 'uuid';
import { DnDFormConfig } from './model';

@Component({
  selector: 'dnd-form-preview',
  template: `
    <p *ngIf="fields.length < 1">
      Add inputs using the form builder to enable form preview
    </p>

    <form [formGroup]="form">
      <formly-form
        [form]="form"
        [model]="model"
        [fields]="fields"
      ></formly-form>
    </form>

    <button mat-raised-button color="accent" (click)="logFormFields()">
      Log Form
    </button>

    <button mat-raised-button color="primary" (click)="addDatepicker()">
      Add datepicker
    </button>
  `,
})
export class DndFormPreviewComponent {
  @Input() fields: DnDFormConfig[] = [];
  form = new FormGroup({});
  model = {};

  logFormFields() {
    console.log({
      model: this.model,
      fields: this.fields,
    });
  }

  addDatepicker() {
    this.fields = [
      ...this.fields,
      {
        dndName: 'DatePicker',
        dndTemp: false,
        key: v4(),
        type: 'datepicker',
        templateOptions: {
          label: 'Datepicker!!',
          required: true,
        },
      },
    ];
  }
}
