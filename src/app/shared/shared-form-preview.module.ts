import { Component, Inject, Injectable, NgModule } from '@angular/core';
import { UntypedFormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { FormlyFieldConfig, FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { FormlyMatDatepickerModule } from '@ngx-formly/material/datepicker';

@Component({
  template: `
    <form [formGroup]="form" class="max-height">
      <formly-form
        [form]="form"
        [fields]="data.fields || []"
        [model]="model"
      ></formly-form>
    </form>
  `,
  styles: ['.max-height { max-height: 90vh; }'],
})
export class FormPreviewDialog {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { fields: FormlyFieldConfig[] }
  ) {}

  form = new UntypedFormGroup({});
  model = {};
}

@Injectable()
export class FormPreviewService {
  constructor(private dialog: MatDialog) {}

  openPreviewModal(
    fields: FormlyFieldConfig[]
  ): MatDialogRef<FormPreviewDialog> {
    return this.dialog.open(FormPreviewDialog, { data: { fields } });
  }
}

@NgModule({
  imports: [
    ReactiveFormsModule,
    FormlyModule.forChild({}),
    MatNativeDateModule,
    MatDatepickerModule,
    MatDialogModule,
    FormlyMaterialModule,
    FormlyMatDatepickerModule,
  ],
  providers: [FormPreviewService],
  declarations: [FormPreviewDialog],
})
export class SharedFormPreviewModule {}
