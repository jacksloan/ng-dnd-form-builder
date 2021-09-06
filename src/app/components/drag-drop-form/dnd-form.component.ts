import {
  ChangeDetectionStrategy,
  Component,
  Input,
  ViewEncapsulation,
} from '@angular/core';
import { BehaviorSubject } from 'rxjs';
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
          listContainerClass="flex flex-col gap-4 w-96 mt-4"
          itemContainerClass="flex flex-row gap-1 bg-white shadow-md p-3 rounded-md items-center"
          (inputDropped)="inputCopySource.cleanupTemporaryFields()"
          (formlyFieldsChange)="formPreviewFields.next($event)"
        >
          <ng-template #dragHandle>
            <div class="w-8 h-8 flex items-center">
              <mat-icon class="cursor-move">drag_indicator</mat-icon>
            </div>
          </ng-template>

          <!-- use itemContainerClass input of parent to control item layout -->
          <ng-template #item let-it>
            <mat-icon>{{ it.item.dndIcon }}</mat-icon>
            <span>
              {{ it.item.templateOptions.label }}
            </span>
          </ng-template>

          <ng-template #placeholder>
            <div
              class="w-full h-64 flex flex-row items-center justify-center border-indigo-400 border-4 border-dashed box-content bg-indigo-50 rounded-md"
            >
              <mat-icon class="text-indigo-200" style="transform: scale(3);">
                add
              </mat-icon>
            </div>
          </ng-template>
        </dnd-list-input-target>
      </div>

      <div *ngIf="userMode === 'preview'" class="pl-6">
        <h2 class="text-xl">Preview</h2>
        <dnd-form-preview
          class="mt-4"
          [fields]="(formPreviewFields | async) || []"
        >
        </dnd-form-preview>
      </div>
    </section>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class DndFormComponent {
  @Input() userMode: 'editing' | 'preview' | null = 'preview';

  formPreviewFields = new BehaviorSubject<DnDFormConfig[]>([]);
}
