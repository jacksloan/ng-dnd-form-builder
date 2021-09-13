import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { EditableModule } from '@ngneat/edit-in-place';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { FormlyMatDatepickerModule } from '@ngx-formly/material/datepicker';
import { DragDropFormModule } from '../../components/drag-drop-form';
import { SharedFormPreviewModule } from '../../shared/shared-form-preview.module';
import { SharedMaterialModule } from '../../shared/shared-material.module';
import { FormBuilderRoutingModule } from './material-example-routing.module';
import { MaterialExampleComponent } from './material-example.component';

@NgModule({
  declarations: [MaterialExampleComponent],
  imports: [
    CommonModule,

    SharedMaterialModule,
    SharedFormPreviewModule,
    EditableModule,
    ReactiveFormsModule,

    // # inputs required for drag drop form module
    DragDropFormModule,
    FormlyModule,
    FormlyMaterialModule,
    FormlyMatDatepickerModule,

    FormBuilderRoutingModule,
  ],
})
export class MaterialExampleModule { }
