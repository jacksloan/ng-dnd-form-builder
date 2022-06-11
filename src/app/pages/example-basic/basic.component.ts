import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { FormPreviewService } from '../../shared/shared-form-preview.module';

@Component({
  selector: 'app-basic',
  template: `
    <mat-toolbar class="flex flex-row justify-between">
      <span>Basic Example</span>
      <ng-container *ngIf="api.fields$ | async as fields">
        <button
          [disabled]="fields.length < 1"
          mat-raised-button
          color="primary"
          (click)="previewForm(fields)"
        >
          <mat-icon>visibility</mat-icon>
          Preview Form
        </button>
      </ng-container>
    </mat-toolbar>
    <dnd-form cdkDropListGroup #api class="basic flex flex-row gap-2 p-2">
      <!-- drag from list -->
      <dnd-list-input-source
        listContainerClass="basic-container"
        itemContainerClass="basic-item"
      >
        <ng-template #input let-it>
          {{ it.input.dndName }}
        </ng-template>
      </dnd-list-input-source>

      <!-- drop list -->
      <dnd-list-input-target
        class="basic-drag-placeholder"
        listContainerClass="basic-container"
        itemContainerClass="basic-item"
      >
        <ng-template #item let-it>
          {{ it.item.dndName }}
        </ng-template>

        <ng-template #placeholder>
          <p class="placeholder">Drop Items Here</p>
        </ng-template>
      </dnd-list-input-target>
    </dnd-form>
  `,
  styles: [
    `
      .placeholder {
        border: 1px dashed black;
        padding: 0.5rem;
        min-width: 7rem;
        cursor: move;
      }
    `,
    // see also "src/styles.css"
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicComponent {
  constructor(private formPreviewService: FormPreviewService) {}

  form = new UntypedFormGroup({});
  model = {};

  previewForm(fields: FormlyFieldConfig[]) {
    this.formPreviewService.openPreviewModal(fields);
  }
}
