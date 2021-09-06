import { CdkDragExit } from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';
import { DndFormService } from './dnd-form.service';

@Component({
  selector: 'dnd-list-input-source',
  template: `
    <div
      cdkDropList
      cdkDropListSortingDisabled
      class="flex flex-col gap-4 px-3"
      [cdkDropListData]="service.copyFromInputs"
      [cdkDropListEnterPredicate]="alwaysPreventDropPredicate"
      (cdkDropListExited)="addTemporaryInput($event)"
      (cdkDropListEntered)="cleanupTmeporaryInputs()"
    >
      <div
        class="flex flex-row items-center justify-start gap-5 p-4 shadow-md bg-white rounded-md cursor-move"
        [class.px-6]="!iconOnly"
        [cdkDragData]="input"
        cdkDrag
        *ngFor="
          let input of service.copyFromInputs;
          let isLast = last;
          let index = index
        "
      >
        <mat-icon [matTooltip]="input.dndName" class="scale-150 block">{{
          input.dndIcon
        }}</mat-icon>
        <span class="w-40" *ngIf="!iconOnly">
          {{ input.dndName }}
        </span>
      </div>
    </div>
  `,
  styles: [':host {display: block;}'],
})
export class DndListInputSourceComponent {
  constructor(public service: DndFormService) {}

  iconOnly = true;

  cleanupTmeporaryInputs() {
    this.service.cleanupTemporaryInputTypes();
  }

  addTemporaryInput(event: CdkDragExit<any>) {
    this.service.addTemporaryInput(event.item.data);
  }

  alwaysPreventDropPredicate() {
    return false;
  }
}
