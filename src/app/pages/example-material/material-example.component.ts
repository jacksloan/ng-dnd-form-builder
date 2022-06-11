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
import { UntypedFormControl } from '@angular/forms';
import { EditableComponent } from '@ngneat/edit-in-place/lib/editable.component';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { DnDFormConfig } from '../../components/drag-drop-form/model';
import { FormPreviewService } from '../../shared/shared-form-preview.module';

@Component({
  selector: 'app-material-example',
  templateUrl: 'material-example.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaterialExampleComponent {
  constructor(
    private cdr: ChangeDetectorRef,
    private formPreviewService: FormPreviewService,
    @Inject(DOCUMENT) private document: Document
  ) {}

  @Input() userMode: 'editing' | 'preview' | null = 'preview';

  @ViewChildren('editable') editable?: QueryList<EditableComponent>;

  controlsByKey: { [k: string]: UntypedFormControl } = {};

  iconOnly = true;

  showPreview(fields: FormlyFieldConfig[]) {
    this.formPreviewService.openPreviewModal(fields);
  }

  editableModeChange(mode: 'view' | 'edit', item: DnDFormConfig) {
    this.controlsByKey[item.key + ''] = new UntypedFormControl();

    if (mode === 'edit') {
      const control = this.controlsByKey[item.key + ''];
      control?.setValue(item.templateOptions?.label);
    }
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
