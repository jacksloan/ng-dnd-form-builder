import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { v4 as createId } from 'uuid';
import { DnDFormConfig } from './model';

@Component({
  selector: 'dnd-list-input-target',
  template: `
    <div
      class="w-96 max-w-full align-top dashed-placeholder"
      [class.hidden-placeholder]="formInputs.length === 0"
    >
      <div
        class="flex flex-col gap-4 rounded-md"
        cdkDropList
        [cdkDropListData]="formInputs"
        [class.list]="formInputs.length > 0"
        [class.empty-drop-zone]="formInputs.length === 0"
        (cdkDropListEntered)="forcePreviewIconContainerHidden = true"
        (cdkDropListExited)="forcePreviewIconContainerHidden = false"
        (cdkDropListDropped)="drop($event)"
      >
        <div
          class="shadow-md bg-white p-4 rounded-md flex flex-row gap-3 relative"
          (mouseenter)="mouserOverItemIndex = index"
          (mouseleave)="mouserOverItemIndex = -1"
          [cdkDragData]="item"
          cdkDrag
          *ngFor="let item of formInputs; let isLast = last; let index = index"
        >
          <div
            class="absolute left-0 h-full cursor-move"
            cdkDragHandle
            *ngIf="mouserOverItemIndex === index"
          >
            <mat-icon class="scale-110">drag_indicator</mat-icon>
          </div>

          <mat-icon class="ml-3">{{ item.dndIcon }}</mat-icon>

          <span>
            {{ item?.templateOptions?.label }}
          </span>
        </div>

        <!-- TODO apply transform scale animation when icon container disappears? -->
        <div
          *ngIf="!forcePreviewIconContainerHidden && formInputs.length < 1"
          class="w-full h-full flex flex-row items-center justify-center"
          matTooltip="Drag & drop and item here to get started"
        >
          <mat-icon class="text-indigo-200" style="transform: scale(3);"
            >add</mat-icon
          >
        </div>
      </div>
    </div>
  `,
  styles: [
    '.cdk-drag-preview { @apply shadow-xl rounded-md; }',
    '.cdk-drop-list-dragging .cdk-drag { transition: transform 250ms cubic-bezier(0, 0, 0.2, 1); }',
    '.cdk-drag-animating { transition: transform 300ms cubic-bezier(0, 0, 0.2, 1); }',
  ],
})
export class DndListInputTargetComponent {
  @Input() formInputs: Array<DnDFormConfig> = [];

  @Output() inputDropped = new EventEmitter<CdkDragDrop<DnDFormConfig[]>>();
  @Output() formlyFieldsChange = new EventEmitter<DnDFormConfig[]>();

  mouserOverItemIndex = -1;
  forcePreviewIconContainerHidden = false;

  drop(event: CdkDragDrop<DnDFormConfig[]>): void {
    this.inputDropped.next(event);

    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      const item: DnDFormConfig = {
        key: createId().replace('-', ''),
        ...event.previousContainer.data[event.previousIndex],
      };
      event.container.data.splice(event.currentIndex, 0, item);
      this.formlyFieldsChange.next([...event.container.data]);
    }
  }
}
