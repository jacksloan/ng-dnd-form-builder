import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { EditableModule } from '@ngneat/edit-in-place';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { FormlyMatDatepickerModule } from '@ngx-formly/material/datepicker';
import { SharedMaterialModule } from 'src/app/shared/shared-material.module';
import { DndFormPreviewComponent } from './dnd-form-preview.component';
import { DndFormComponent } from './dnd-form.component';
import { DndListInputSourceComponent } from './dnd-list-input-source.component';
import { DndListInputTargetComponent } from './dnd-list-input-target.component';

const components = [
  DndListInputSourceComponent,
  DndListInputTargetComponent,
  DndFormPreviewComponent,
  DndFormComponent,
];

@NgModule({
  imports: [
    CommonModule,
    EditableModule,
    DragDropModule,
    ReactiveFormsModule,
    SharedMaterialModule,
    FormlyModule.forChild({}),
    FormlyMaterialModule,
    FormlyMatDatepickerModule,
  ],
  declarations: components,
  exports: components,
})
export class DragDropFormModule {}
