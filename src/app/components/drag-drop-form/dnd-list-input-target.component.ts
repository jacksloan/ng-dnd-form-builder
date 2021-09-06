import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  ContentChild,
  EventEmitter,
  Inject,
  Input,
  Output,
  QueryList,
  TemplateRef,
  ViewChildren,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { EditableComponent } from '@ngneat/edit-in-place/lib/editable.component';
import { v4 as createId } from 'uuid';
import { DnDFormConfig } from './model';

@Component({
  selector: 'dnd-list-input-target',
  template: `
    <div
      [class]="listContainerClass"
      [class.hidden-placeholder]="formInputs.length === 0"
      cdkDropList
      [cdkDropListData]="formInputs"
      [class.list]="formInputs.length > 0"
      (cdkDropListEntered)="forcePreviewIconContainerHidden = true"
      (cdkDropListExited)="forcePreviewIconContainerHidden = false"
      (cdkDropListDropped)="drop($event)"
    >
      <div
        cdkDrag
        (mouseenter)="mouserOverItemIndex = index"
        (mouseleave)="mouserOverItemIndex = -1"
        [cdkDragData]="item"
        *ngFor="let item of formInputs; let isLast = last; let index = index"
        [class]="itemContainerClass"
      >
        <!-- 
          cdkDragHandle must be a direct descendant of the cdkDrag item.
          E.g. we can't do this:
            <ng-template let-it #item>
              <mat-icon cdkDragHandle>drag_indicator</mat-icon> // won't work!
              <mat-icon>{{ it.item.dndIcon }}</mat-icon>
              <span>
                {{ it.item.templateOptions.label }}
              </span>
            </ng-template>
        -->
        <span cdkDragHandle *ngIf="dragHandleRef">
          <ng-container [ngTemplateOutlet]="dragHandleRef"></ng-container>
        </span>
        <ng-template
          [ngTemplateOutlet]="itemRef || null"
          [ngTemplateOutletContext]="{
                $implicit: {
                  item, 
                  isHovered: mouserOverItemIndex === index
                }
              }"
        >
        </ng-template>
      </div>

      <!-- TODO apply transform scale animation when icon container disappears? -->
      <ng-container
        *ngIf="!forcePreviewIconContainerHidden && formInputs.length < 1"
      >
        <ng-template [ngTemplateOutlet]="placeholderRef || null"></ng-template>
      </ng-container>
    </div>

    <ng-template #body> </ng-template>
  `,
  styles: [':host {display: block;}'],
})
export class DndListInputTargetComponent {
  @ViewChildren('editables') editables?: QueryList<EditableComponent>;

  @ContentChild('item') itemRef?: TemplateRef<any>;
  @ContentChild('placeholder') placeholderRef?: TemplateRef<any>;
  @ContentChild('dragHandle') dragHandleRef?: TemplateRef<any>;

  @Input() listContainerClass: string = '';
  @Input() itemContainerClass: string = '';

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
    this.controlsByKey = {};
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
        event.container.data, // current target container data before item dropped
        event.previousIndex, // index of the item in the source container being dragged
        event.currentIndex // desired index of item in the target container
      );
    } else {
      const item: DnDFormConfig = {
        key: createId().replace('-', ''),
        ...event.previousContainer.data[event.previousIndex],
      };
      event.container.data.splice(event.currentIndex, 0, item);
      this.focusAndSelectedEditableInputText(event.currentIndex);
    }
    this.formlyFieldsChange.next([...event.container.data]);
  }

  focusAndSelectedEditableInputText(currentIndex: number) {
    this.cdr.detectChanges();
    const editable = this.editables?.get(currentIndex);
    if (editable) {
      editable.displayEditMode();
      this.cdr.detectChanges();
      const formKey = this.formInputs[currentIndex].key as string;
      const input = this.doc.getElementById(formKey) as HTMLInputElement;
      input?.focus();
      input?.select();
      this.cdr.detectChanges();
    }
  }
}
