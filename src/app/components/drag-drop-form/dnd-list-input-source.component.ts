import { CdkDragExit } from '@angular/cdk/drag-drop';
import { Component, ContentChild, Input, TemplateRef } from '@angular/core';
import { DndFormService } from './dnd-form.service';
import { DnDFormConfig } from './model';

@Component({
  selector: 'dnd-list-input-source',
  template: `
    <div
      cdkDropList
      cdkDropListSortingDisabled
      [class]="listContainerClass"
      [cdkDropListData]="service.copyFromInputs"
      [cdkDropListEnterPredicate]="_alwaysPreventDropPredicate"
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
  constructor(public service: DndFormService) {}

  @Input() listContainerClass: string = '';
  @Input() itemContainerClass: string = '';

  /**
   * #input content child is passed the context:
   * {
   *    input: DndFormConfig,
   *    index: number,
   *    isLast: boolean,
   * }
   */
  @ContentChild('input') itemRef!: TemplateRef<any>;

  public addItem(config: DnDFormConfig) {
    this.service.addItem(config);
  }

  public cleanupTmeporaryInputs() {
    this.service.cleanupTemporaryInputTypes();
  }

  public addTemporaryInput(event: CdkDragExit<any>) {
    this.service.addTemporaryInput(event.item.data);
  }

  _alwaysPreventDropPredicate() {
    return false;
  }
}
