import { CdkDragEnter, CdkDragExit } from '@angular/cdk/drag-drop';
import { Component, Input, OnInit } from '@angular/core';
import { DnDFormConfig, DndFormInputs } from './model';

type DndSourceListViewMode = 'compact' | 'medium' | 'full';

@Component({
  selector: 'dnd-list-input-source',
  template: `
    <div
      cdkDropList
      cdkDropListSortingDisabled
      class="flex flex-col gap-4 px-3"
      [cdkDropListData]="_inputTypes"
      [cdkDropListEnterPredicate]="_allowDropList"
      (cdkDropListExited)="_onSourceListExited($event)"
      (cdkDropListEntered)="_onSourceListEntered($event)"
    >
      <div
        class="flex flex-row items-center justify-start gap-5 p-4 shadow-md bg-white rounded-md cursor-move"
        [class.text-normal]="isMedium"
        [class.px-6]="showText"
        [cdkDragData]="input"
        cdkDrag
        *ngFor="let input of _inputTypes; let isLast = last; let index = index"
      >
        <mat-icon
          [matTooltip]="input.dndName"
          *ngIf="showIcon"
          class="scale-150 block"
          >{{ input.dndIcon }}</mat-icon
        >
        <span [class.w-32]="isMedium" [class.w-40]="isFull" *ngIf="showText">
          {{ input.dndName }}
        </span>
      </div>
    </div>
  `,
  styles: [
    ':host {display: block;}',
    '.cdk-drag-preview { @apply shadow-xl rounded-md; }',
    '.cdk-drop-list-dragging .cdk-drag { transition: transform 250ms cubic-bezier(0, 0, 0.2, 1); }',
    '.cdk-drag-animating { transition: transform 300ms cubic-bezier(0, 0, 0.2, 1); }',
  ],
})
export class DndListInputSourceComponent implements OnInit {
  get viewMode(): DndSourceListViewMode {
    return this._viewMode;
  }
  private _viewMode: DndSourceListViewMode = 'compact';
  @Input() set viewMode(m: DndSourceListViewMode) {
    this._viewMode = m;
    this.setupViewModeMatchers();
  }

  ngOnInit() {
    this.setupViewModeMatchers();
  }

  isMedium: boolean | undefined;
  isFull: boolean | undefined;
  isCompact: boolean | undefined;
  showIcon: boolean | undefined;
  showText: boolean | undefined;

  private setupViewModeMatchers() {
    this.isCompact = this.matches('compact');
    this.isFull = this.matches('full');
    this.isMedium = this.matches('medium');
    this.showIcon = this.matches('compact', 'full');
    this.showText = this.matches('medium', 'full');
  }

  private matches(...viewMode: DndSourceListViewMode[]) {
    return viewMode.includes(this.viewMode);
  }

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
