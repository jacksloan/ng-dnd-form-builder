import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { EditableModule } from '@ngneat/edit-in-place';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { FormlyMatDatepickerModule } from '@ngx-formly/material/datepicker';
import { DragDropFormModule } from 'src/app/components/drag-drop-form/dnd-form.module';
import { SharedFormPreviewModule } from 'src/app/shared/shared-form-preview.module';
import { SharedMaterialModule } from 'src/app/shared/shared-material.module';
import { FormBuilderRoutingModule } from './form-builder-material-routing.module';
import { FormBuilderComponent } from './form-builder-material.component';
import { MaterialExampleComponent } from './material-example.component';

@NgModule({
  declarations: [FormBuilderComponent, MaterialExampleComponent],
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
export class FormBuilderMaterialModule {}
