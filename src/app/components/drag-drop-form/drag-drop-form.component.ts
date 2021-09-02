import { CdkDragDrop, copyArrayItem } from '@angular/cdk/drag-drop';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { v4 as createId } from 'uuid';

interface DnDFormConfig {
  name: string;
  config: FormlyFieldConfig;
}

type DndInputType = 'Text' | 'Number' | 'DatePicker' | 'Radio' | 'Checkbox';

function createDndFormCongfig(input: DndInputType): FormlyFieldConfig {
  switch (input) {
    // TODO
    case 'Text':
    case 'Number':
    case 'DatePicker':
    case 'Radio':
    case 'DatePicker':
    case 'Checkbox':
    default:
      // throw new Error(`Unknown DndInputType ${input}`)
      return {
        key: '',
        type: 'input',
      };
  }
}

@Component({
  selector: 'app-drag-drop-form',
  templateUrl: './drag-drop-form.component.html',
  styleUrls: ['./drag-drop-form.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DragDropFormComponent {
  inputTypes: DndInputType[] = [
    'Text',
    'Number',
    'DatePicker',
    'Radio',
    'Checkbox',
  ];

  formInputs: Array<FormlyFieldConfig> = [
    // 'Get up',
    // 'Brush teeth',
    // 'Take a shower',
    // 'Check e-mail',
    // 'Walk dog'
  ];

  drop(event: CdkDragDrop<(DndInputType | FormlyFieldConfig | any)[], FormlyFieldConfig[]>): void {
    copyArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
  }
}
