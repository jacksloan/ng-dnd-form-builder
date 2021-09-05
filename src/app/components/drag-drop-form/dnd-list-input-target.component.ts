import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectorRef,
  Component, EventEmitter,
  Inject,
  Input,
  Output,
  QueryList,
  ViewChildren
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { EditableComponent } from '@ngneat/edit-in-place/lib/editable.component';
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

          <editable
            #editables
            (modeChange)="editableModeChange($event, item)"
            (save)="editableUpdate(index, item)"
          >
            <ng-template viewMode>{{
              item?.templateOptions?.label || 'Unknown'
            }}</ng-template>

            <ng-template editMode>
              <input
                editableOnEnter
                (focusout)="editables.cancelEdit()"
                [id]="item.key"
                [formControl]="controlsByKey[item.key + '']"
              />
            </ng-template>
          </editable>
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
    ':host {display: block;}',
    '.cdk-drag-preview { @apply shadow-xl rounded-md; }',
    '.cdk-drop-list-dragging .cdk-drag { transition: transform 250ms cubic-bezier(0, 0, 0.2, 1); }',
    '.cdk-drag-animating { transition: transform 300ms cubic-bezier(0, 0, 0.2, 1); }',
  ],
})
export class DndListInputTargetComponent {
  @ViewChildren('editables') editables?: QueryList<EditableComponent>;

  private _formInputs: Array<DnDFormConfig> = [];

  @Input() set formInputs(c: Array<DnDFormConfig>) {
    this._formInputs = c;
    this.formlyFieldsChange.next(this._formInputs);
  }

  get formInputs(): Array<DnDFormConfig> {
    return this._formInputs;
  }

  @Output() inputDropped = new EventEmitter<CdkDragDrop<DnDFormConfig[]>>();
  @Output() formlyFieldsChange = new EventEmitter<DnDFormConfig[]>();

  constructor(
    @Inject(DOCUMENT) private doc: Document,
    private cdr: ChangeDetectorRef
  ) {}

  controlsByKey: { [k: string]: FormControl } = {};
  mouserOverItemIndex = -1;
  forcePreviewIconContainerHidden = false;

  editableModeChange(mode: 'view' | 'edit', item: DnDFormConfig) {
    this.controlsByKey = JSON.parse('{}');
    this.controlsByKey[item.key + ''] = new FormControl();
    const control = this.controlsByKey[item.key + ''];
    control?.setValue(item.templateOptions?.label);
  }

  editableUpdate(indexForUpdate: number, item: DnDFormConfig) {
    const newValue = this.controlsByKey[item.key + '']?.value || 'unknown';
    this.formInputs = this.formInputs.map((item, index) => {
      if (index === indexForUpdate) {
        return {
          ...item,
          templateOptions: { ...item.templateOptions, label: newValue },
        };
      } else {
        return item;
      }
    });
  }

  drop(event: CdkDragDrop<DnDFormConfig[]>): void {
    // rebroadcast drop event to consumers of this component
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
      this.focusEditableInput(event.currentIndex);
    }
    this.formlyFieldsChange.next([...event.container.data]);
  }

  focusEditableInput(currentIndex: number) {
    this.cdr.detectChanges();
    const editable = this.editables?.get(currentIndex);
    if (editable) {
      editable.displayEditMode();
      this.cdr.detectChanges();
      const id = this.formInputs[currentIndex].key as string;
      const input = this.doc.getElementById(id);
      input?.focus();
    }
  }
}
