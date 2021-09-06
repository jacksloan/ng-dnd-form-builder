import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  Input,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { EditableComponent } from '@ngneat/edit-in-place/lib/editable.component';
import { DndFormService } from './dnd-form.service';
import { DnDFormConfig } from './model';

@Component({
  selector: 'dnd-form',
  providers: [DndFormService],
  template: `
    <section cdkDropListGroup class="flex flex-row p-4 gap-2">
      <dnd-list-input-source
        listContainerClass="flex flex-col gap-4 px-3"
        itemContainerClass="flex flex-row items-center justify-start gap-5 p-4 shadow-md bg-white rounded-md cursor-move"
      >
        <ng-template #input let-it>
          <mat-icon [matTooltip]="it.input.dndName" class="scale-150 block">
            {{ it.input.dndIcon }}
          </mat-icon>
          <span class="w-40" *ngIf="!iconOnly">
            {{ it.input.dndName }}
          </span>
        </ng-template>
      </dnd-list-input-source>

      <dnd-list-input-target
        listContainerClass="flex flex-col gap-4 w-96 dashed-cdk-drag-placeholder"
        itemContainerClass="flex flex-row gap-1 bg-white shadow-md p-3 rounded-md items-center"
        (inputAdded)="focusAndSelectedEditableInputText($event)"
      >
        <ng-template #dragHandle>
          <div class="w-8 h-8 flex items-center">
            <mat-icon class="cursor-move">drag_indicator</mat-icon>
          </div>
        </ng-template>

        <!-- use itemContainerClass input of parent to control item layout -->
        <ng-template #item let-it>
          <mat-icon>{{ it.item?.dndIcon }}</mat-icon>

          <editable
            class="w-full"
            [id]="[it.item.key] + '-editable'"
            #editable
            (modeChange)="editableModeChange($event, it.item)"
            (save)="
              editableUpdate(it.item, controlsByKey[it.item.key + ''].value)
            "
          >
            <ng-template viewMode>
              {{ it.item?.templateOptions?.label || 'Unknown' }}
            </ng-template>

            <ng-template editMode>
              <input
                class="w-full form-input h-8 rounded-sm"
                editableOnEnter
                (focusout)="editable.saveEdit()"
                [id]="it.item.key"
                [formControl]="controlsByKey[it.item.key + '']"
              />
            </ng-template>
          </editable>
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

      <dnd-form-preview
        *ngIf="userMode === 'preview'"
        class="ml-6"
        [fields]="(fields$ | async) || []"
      >
      </dnd-form-preview>
    </section>
  `,
  styles: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DndFormComponent {
  constructor(
    public service: DndFormService,
    private cdr: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document
  ) {}

  @Input() userMode: 'editing' | 'preview' | null = 'preview';

  @ViewChildren('editable') editable?: QueryList<EditableComponent>;

  fields$ = this.service.fields$;
  controlsByKey: { [k: string]: FormControl } = {};
  iconOnly = true;

  editableModeChange(mode: 'view' | 'edit', item: DnDFormConfig) {
    this.controlsByKey = {};

    if (mode === 'edit') {
      this.controlsByKey[item.key + ''] = new FormControl();
      const control = this.controlsByKey[item.key + ''];
      control?.setValue(item.templateOptions?.label);
    }
  }

  editableUpdate(item: DnDFormConfig, newLabel: string) {
    this.service.updateFormLabel(item, (newLabel || '').trim());
  }

  focusAndSelectedEditableInputText(c: DnDFormConfig) {
    this.cdr.detectChanges();

    // TODO - is there a better way to find the editable than to add an ID attribute?
    const editable = this.editable?.find((e) => {
      const editableId = (e as any)?.el?.nativeElement?.id;
      return editableId === c.key + '-editable';
    });

    if (editable) {
      editable.displayEditMode();
      this.cdr.detectChanges();
      const key = c.key + '';
      const input = this.document.getElementById(key) as HTMLInputElement;
      input?.focus();
      input?.select();
      this.cdr.detectChanges();
    }
  }
}
