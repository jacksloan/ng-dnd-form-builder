import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { v4 as createId } from 'uuid';
import { DnDFormConfig, DndFormInputs } from './model';

@Injectable()
export class DndFormService {
  copyFromInputs: DnDFormConfig[] = [...DndFormInputs];
  dropInputs: DnDFormConfig[] = [];
  private _fields$ = new BehaviorSubject<DnDFormConfig[]>([]);
  fields$ = this._fields$.asObservable();

  handleDropEvent(
    event: CdkDragDrop<DnDFormConfig[]>
  ): DnDFormConfig | undefined {
    this.cleanupTemporaryInputTypes();
    const { data } = event.item;
    try {
      if (event.previousContainer === event.container) {
        moveItemInArray(
          event.container.data, // current target container data before item dropped
          event.previousIndex, // index of the item in the source container being dragged
          event.currentIndex // desired index of item in the target container
        );
        return data;
      } else {
        const key = createId().replace('-', '');
        const item: DnDFormConfig = { key, ...data };
        event.container.data.splice(event.currentIndex, 0, item);
        return item;
      }
    } finally {
      this.setFields();
    }
  }

  setFields(config: DnDFormConfig[] = this.dropInputs) {
    this._fields$.next(JSON.parse(JSON.stringify(config)));
  }

  addItem(config: DnDFormConfig) {
    this.dropInputs = this.dropInputs.concat(config);
    this.setFields();
  }

  updateFormLabel(config: DnDFormConfig, label: string) {
    this.dropInputs = this.dropInputs.map((item) => {
      if (item.key === config.key) {
        return {
          ...item,
          templateOptions: { ...item.templateOptions, label },
        };
      } else {
        return item;
      }
    });
    this.setFields();
  }

  cleanupTemporaryInputTypes() {
    this.copyFromInputs = this.copyFromInputs.filter((it) => !it.dndTemp);
  }

  addTemporaryInput(data: DnDFormConfig) {
    // dnd hack - leaving 'copy from' list, create a temporary item to make the list look the same
    const index = this.copyFromInputs.findIndex((it) => it === data);
    this.copyFromInputs.splice(index + 1, 0, {
      ...data,
      dndTemp: true,
    });
  }
}
