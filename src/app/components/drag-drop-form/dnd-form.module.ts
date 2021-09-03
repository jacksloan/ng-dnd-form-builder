import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { DndCopyListSourceComponent } from './dnd-list-input-source.component';
import { DndFormPreviewComponent } from './dnd-form-preview.component';
import { DndFormTargetListComponent } from './dnd-list-input-target.component';
import { DndFormComponent } from './dnd-form.component';
import { FormlyMatDatepickerModule } from '@ngx-formly/material/datepicker';

const components = [
  DndCopyListSourceComponent,
  DndFormTargetListComponent,
  DndFormPreviewComponent,
  DndFormComponent,
];

@NgModule({
  imports: [
    CommonModule,
    DragDropModule,
    ReactiveFormsModule,
    FormlyModule.forChild({}),
    FormlyMaterialModule,
    MatNativeDateModule,
    FormlyMatDatepickerModule,
  ],
  declarations: components,
  exports: components,
})
export class DragDropFormModule {}
