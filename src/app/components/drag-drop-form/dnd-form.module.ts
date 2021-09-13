import { CdkDropListGroup, DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { EditableModule } from '@ngneat/edit-in-place';
import { SharedMaterialModule } from '../../shared/shared-material.module';
import { DndFormComponent } from './dnd-form.component';
import { DndListInputSourceComponent } from './dnd-list-input-source.component';
import { DndListInputTargetComponent } from './dnd-list-input-target.component';

const components = [
  DndListInputSourceComponent,
  DndListInputTargetComponent,
  DndFormComponent,
];

@NgModule({
  imports: [
    CommonModule,
    EditableModule,
    DragDropModule,
    ReactiveFormsModule,
    SharedMaterialModule,
  ],
  declarations: components,
  exports: [components, CdkDropListGroup],
})
export class DragDropFormModule {}
