import { CdkDragEnter, CdkDragExit } from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';
import { DnDFormConfig, DndFormInputs } from './model';

@Component({
  selector: 'dnd-list-input-source',
  template: `
    <div class="container drag-list hidden-placeholder">
      <div
        class="list"
        cdkDropList
        cdkDropListSortingDisabled
        [cdkDropListData]="_inputTypes"
        [cdkDropListEnterPredicate]="_allowDropList"
        (cdkDropListExited)="_onSourceListExited($event)"
        (cdkDropListEntered)="_onSourceListEntered($event)"
      >
        <div
          [class.border-none]="isLast"
          class="item"
          *ngFor="
            let input of _inputTypes;
            let isLast = last;
            let index = index
          "
          cdkDrag
          [cdkDragData]="input"
        >
          {{ input.dndName }}
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
export class DndListInputSourceComponent {
  public cleanupTemporaryFields() {
    this._inputTypes = this._inputTypes.filter((it) => !it.dndTemp);
  }

  _inputTypes: DnDFormConfig[] = [...DndFormInputs];

  _allowDropList() {
    // always prevent items from being dropped
    return false;
  }

  _onSourceListExited(event: CdkDragExit<any>) {
    // dnd hack - leaving 'copy from' list, create a temporary item to make the list look the same
    const index = this._inputTypes.findIndex((it) => it === event.item.data);
    this._inputTypes.splice(index + 1, 0, {
      ...event.item.data,
      dndTemp: true,
    });
  }

  _onSourceListEntered(event: CdkDragEnter<any>) {
    // dnd hack - remove temporary copies
    this.cleanupTemporaryFields();
  }
}
