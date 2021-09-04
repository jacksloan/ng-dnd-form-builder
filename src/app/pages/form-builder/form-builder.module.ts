import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormlyModule } from '@ngx-formly/core';
import { DragDropFormModule } from 'src/app/components/drag-drop-form/dnd-form.module';
import { SharedMaterialModule } from 'src/app/shared/shared-material.module';
import { FormBuilderRoutingModule } from './form-builder-routing.module';
import { FormBuilderComponent } from './form-builder.component';

@NgModule({
  declarations: [FormBuilderComponent],
  imports: [
    CommonModule,
    DragDropFormModule,
    SharedMaterialModule,
    FormlyModule.forRoot({ extras: { lazyRender: true } }),
    FormBuilderRoutingModule,
  ],
})
export class FormBuilderModule {}
