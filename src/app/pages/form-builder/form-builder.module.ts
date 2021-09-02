import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DragDropFormModule } from 'src/app/components/drag-drop-form/drag-drop-form.module';
import { SharedMaterialModule } from 'src/app/shared/shared-material.module';
import { FormBuilderRoutingModule } from './form-builder-routing.module';
import { FormBuilderComponent } from './form-builder.component';

@NgModule({
  declarations: [FormBuilderComponent],
  imports: [CommonModule, DragDropFormModule, SharedMaterialModule, FormBuilderRoutingModule],
})
export class FormBuilderModule {}
