import { CdkDragExit } from '@angular/cdk/drag-drop';
import { Component, ContentChild, Input, TemplateRef } from '@angular/core';
import { DndFormService } from './dnd-form.service';

@Component({
  selector: 'dnd-list-input-source',
  template: `
    <div
      cdkDropList
      cdkDropListSortingDisabled
      [class]="listContainerClass"
      [cdkDropListData]="service.copyFromInputs"
      [cdkDropListEnterPredicate]="alwaysPreventDropPredicate"
      (cdkDropListExited)="addTemporaryInput($event)"
      (cdkDropListEntered)="cleanupTmeporaryInputs()"
    >
      <div
        [class]="itemContainerClass"
        [cdkDragData]="input"
        cdkDrag
        *ngFor="
          let input of service.copyFromInputs;
          let isLast = last;
          let index = index
        "
      >
        <ng-template
          [ngTemplateOutlet]="itemRef || null"
          [ngTemplateOutletContext]="{
                $implicit: {
                  input, 
                  index,
                  isLast
                }
              }"
        >
        </ng-template>
      </div>
    </div>
  `,
  styles: [':host {display: block;}'],
})
export class DndListInputSourceComponent {
  @Input() listContainerClass: string = '';
  @Input() itemContainerClass: string = '';

  @ContentChild('input') itemRef!: TemplateRef<any>;

  constructor(public service: DndFormService) {}

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
