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
    <section cdkDropListGroup class="flex flex-row p-4 gap-2">
      <div>
        <h2 class="text-xl">Inputs</h2>
        <dnd-list-input-source
          class="mt-4"
          #inputCopySource
        ></dnd-list-input-source>
      </div>
      <div>
        <h2 class="text-xl">Form</h2>
        <dnd-list-input-target
          class="mt-4"
          [formInputs]="formTargetFields"
          (inputDropped)="inputCopySource.cleanupTemporaryFields()"
          (formlyFieldsChange)="setFormPreviewFields($event)"
        >
          <ng-template let-item>
            <dnd-container
              class="border-2 border-blue-500"
              [class.border-red-500]="item.isHovered"
            >
              Hello World
            </dnd-container>
          </ng-template>
        </dnd-list-input-target>
      </div>

      <div *ngIf="userMode === 'preview'" class="pl-6">
        <h2 class="text-xl">Preview</h2>
        <dnd-form-preview class="mt-4" [fields]="formPreviewFields">
        </dnd-form-preview>
      </div>
    </section>
  `,
  styles: [
    'dnd-form section { @apply flex flex-row p-4 gap-2 }',
    'dnd-form .dashed-placeholder .cdk-drag-placeholder { @apply border-indigo-400 border-4 border-dashed box-content; }',
    'dnd-form .empty-drop-zone { @apply border-indigo-400 border-4 border-dashed box-content bg-indigo-50 h-64 rounded-md; }',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class DndFormComponent {
  @Input() userMode: 'editing' | 'preview' | null = 'preview';

  formTargetFields: DnDFormConfig[] = [];

  formPreviewFields: DnDFormConfig[] = [];

  setFormPreviewFields($event: DnDFormConfig[]) {
    this.formPreviewFields = $event;
  }
}
