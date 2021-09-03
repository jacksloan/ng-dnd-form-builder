import {
  CdkDragDrop,
  CdkDragEnter,
  CdkDragExit,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyTemplateOptions } from '@ngx-formly/core';
import { v4 as createId } from 'uuid';

type DndInputType =
  | 'Text'
  | 'Number'
  | 'DatePicker'
  | 'Radio'
  | 'Checkbox'
  | 'Group';

type DnDFormConfig = FormlyFieldConfig & {
  dndName: DndInputType;
  dndTemp: boolean;
};

@Component({
  selector: 'app-drag-drop-form',
  templateUrl: './drag-drop-form.component.html',
  styleUrls: ['./drag-drop-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DragDropFormComponent {
  inputTypes: DnDFormConfig[] = [
    'Text',
    'Number',
    'DatePicker',
    'Radio',
    'Checkbox',
    'Group',
    // 'Step', TODO add stepper type
  ].map((dndName) => {
    const isGrouped = dndName === 'Group';

    const field = <DnDFormConfig>{
      dndName,
      dndTemp: false,
      fieldGroup: isGrouped ? [] : undefined,
      type: isGrouped ? undefined : 'input',
      templateOptions: {
        label: dndName + ' Label',
        type: isGrouped ? undefined : 'text',
        required: isGrouped ? undefined : true,
      },
    };
    return field;
  });

  @Input() userMode: 'editing' | 'preview' = 'editing';
  formInputs: Array<DnDFormConfig> = [];
  formPreview = new FormGroup({});
  formPreviewModel = {};
  formPreviewFields: FormlyFieldConfig[] = [];

  noReturnPredicate() {
    return false;
  }

  onSourceListExited(event: CdkDragExit<any>) {
    // dnd hack - leaving 'copy from' list, create a temporary item to make the list look the same
    const index = this.inputTypes.findIndex((it) => it === event.item.data);
    this.inputTypes.splice(index + 1, 0, { ...event.item.data, dndTemp: true });
  }

  onSourceListEntered(event: CdkDragEnter<any>) {
    // dnd hack - remove temporary copies
    this.inputTypes = this.inputTypes.filter((it) => !it.dndTemp);
  }

  drop(event: CdkDragDrop<DnDFormConfig[]>, skip: boolean = false): void {
    if (event.previousContainer.data) {
      // dnd hack - remove temporary list items on drop
      this.inputTypes = this.inputTypes.filter((it) => !it.dndTemp);
    }

    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      const item: DnDFormConfig = {
        ...event.previousContainer.data[event.previousIndex],
        key: createId(),
      };
      event.container.data.splice(event.currentIndex, 0, item);
      this.formPreviewFields = [...event.container.data];
      console.log(this.formPreviewFields);
    }
  }
}
