import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { DragDropFormComponent } from './drag-drop-form.component';

const components = [DragDropFormComponent];

@NgModule({
  imports: [
    CommonModule,
    DragDropModule,
    ReactiveFormsModule,
    FormlyModule.forChild({}),
    FormlyMaterialModule
  ],
  declarations: components,
  exports: components,
})
export class DragDropFormModule {}
