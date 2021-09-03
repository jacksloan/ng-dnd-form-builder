import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DnDFormConfig } from './model';
import { v4 as createId } from 'uuid';

@Component({
  selector: 'dnd-form-target-list',
  template: `
    <div
      class="container dashed-placeholder"
      [class.hidden-placeholder]="formInputs.length === 0"
    >
      <div
        cdkDropList
        [cdkDropListData]="formInputs"
        [class.list]="formInputs.length > 0"
        [class.empty-drop-zone]="formInputs.length === 0"
        (cdkDropListDropped)="drop($event)"
      >
        <div
          [class.border-none]="isLast"
          class="item"
          *ngFor="let item of formInputs; let isLast = last"
          cdkDrag
          [cdkDragData]="item"
        >
          {{ item?.templateOptions?.label }}
        </div>
        <p *ngIf="formInputs.length === 0">Drop an input here</p>
      </div>
    </div>
  `,
  styles: [
    '.cdk-drag-preview { @apply shadow-xl rounded-md; }',
    '.cdk-drop-list-dragging .cdk-drag { transition: transform 250ms cubic-bezier(0, 0, 0.2, 1); }',
    '.cdk-drag-animating { transition: transform 300ms cubic-bezier(0, 0, 0.2, 1); }',
  ],
})
export class DndFormTargetListComponent {
  @Input() formInputs: Array<DnDFormConfig> = [];

  @Output() inputDropped = new EventEmitter<CdkDragDrop<DnDFormConfig[]>>();
  @Output() formlyFieldsChange = new EventEmitter<DnDFormConfig[]>();

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
      this.formlyFieldsChange.next(event.container.data);
    }
  }
}
