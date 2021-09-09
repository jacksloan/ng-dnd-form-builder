import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { EditableModule } from '@ngneat/edit-in-place';
import { FormlyModule } from '@ngx-formly/core';
import { DragDropFormModule } from 'src/app/components/drag-drop-form/dnd-form.module';
import { SharedFormPreviewModule } from 'src/app/shared/shared-form-preview.module';
import { SharedMaterialModule } from 'src/app/shared/shared-material.module';
import { FormBuilderRoutingModule } from './basic-routing.module';
import { BasicComponent } from './basic.component';

@NgModule({
  declarations: [BasicComponent],
  imports: [
    CommonModule,
    DragDropFormModule,
    ReactiveFormsModule,
    EditableModule,

    SharedMaterialModule,
    SharedFormPreviewModule,
    FormlyModule,
    FormBuilderRoutingModule,
  ],
})
export class BasicModule {}
