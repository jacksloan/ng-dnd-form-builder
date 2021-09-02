import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormlyModule } from '@ngx-formly/core';
import { DragDropFormComponent } from './drag-drop-form.component';

const components = [DragDropFormComponent];

@NgModule({
  imports: [CommonModule, DragDropModule, FormlyModule.forChild({})],
  declarations: components,
  exports: components,
})
export class DragDropFormModule {}
