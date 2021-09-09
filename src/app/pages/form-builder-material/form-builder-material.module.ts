import { DragDropModule } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { EditableModule } from '@ngneat/edit-in-place';
import { FormlyModule } from '@ngx-formly/core';
import { DragDropFormModule } from 'src/app/components/drag-drop-form/dnd-form.module';
import { SharedMaterialModule } from 'src/app/shared/shared-material.module';
import { FormBuilderRoutingModule } from './form-builder-material-routing.module';
import { FormBuilderComponent } from './form-builder-material.component';
import { MaterialExampleComponent } from './material-example.component';

@NgModule({
  declarations: [FormBuilderComponent, MaterialExampleComponent],
  imports: [
    CommonModule,
    DragDropFormModule,
    SharedMaterialModule,
    EditableModule,
    ReactiveFormsModule,
    FormlyModule.forRoot({ extras: { lazyRender: true } }),
    FormBuilderRoutingModule,
  ],
})
export class FormBuilderMaterialModule {}
