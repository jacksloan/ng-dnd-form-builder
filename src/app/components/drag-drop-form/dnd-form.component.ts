import {
  ChangeDetectionStrategy,
  Component,
  Input,
  ViewEncapsulation,
} from '@angular/core';
import { DnDFormConfig } from './model';

@Component({
  selector: 'dnd-form',
  template: `
    <section cdkDropListGroup *ngIf="userMode === 'editing'">
      <div>
        <h2 class="text-xl">Inputs</h2>
        <dnd-list-input-source
          class="block mt-4"
          #inputCopySource
        ></dnd-list-input-source>
      </div>
      <div>
        <h2 class="text-xl">Form</h2>
        <dnd-list-input-target
          class="block mt-4"
          [formInputs]="formTargetFields"
          (inputDropped)="inputCopySource.cleanupTemporaryFields()"
          (formlyFieldsChange)="setFormPreviewFields($event)"
        ></dnd-list-input-target>
      </div>
    </section>

    <section *ngIf="userMode === 'preview'">
      <dnd-form-preview [fields]="formPreviewFields"> </dnd-form-preview>
    </section>
  `,
  styles: [
    'section { @apply flex flex-row p-4 gap-2 }',
    '.container { @apply w-96 max-w-full align-top; }',
    '.list { @apply border border-gray-300 rounded-md block overflow-hidden; }',
    '.item { @apply py-5 px-3 border-b border-gray-300 cursor-move text-sm bg-white; }',
    '.dashed-placeholder .cdk-drag-placeholder { @apply border-indigo-400 border-4 border-dashed box-content; }',
    '.empty-drop-zone { @apply border-indigo-400 border-4 border-dashed box-content bg-indigo-50 h-64 rounded-md; }',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class DndFormComponent {
  @Input() userMode: 'editing' | 'preview' = 'editing';

  formTargetFields: DnDFormConfig[] = [];

  formPreviewFields: DnDFormConfig[] = [];

  setFormPreviewFields($event: DnDFormConfig[]) {
    this.formPreviewFields = $event;
  }
}
