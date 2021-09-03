import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-form-builder',
  template: `
    <mat-toolbar class="flex flex-row justify-between">
      <span>Drag and Drop Form Builder</span>
      <button mat-icon-button (click)="switchUserMode()">
        <mat-icon [matTooltip]="userModeTooltip">
          {{ userModeIcon }}
        </mat-icon>
      </button>
    </mat-toolbar>
    <dnd-form [userMode]="this.userMode"></dnd-form>
  `,
})
export class FormBuilderComponent {
  userMode: 'editing' | 'preview' = 'editing';
  userModeIcon = this.userMode === 'editing' ? 'visibility' : 'visibility_off';
  userModeTooltip = this.userMode === 'editing' ? 'Preview Form' : 'Edit Form';
  switchUserMode() {
    switch (this.userMode) {
      case 'editing':
        this.userMode = 'preview';
        break;
      case 'editing':
        this.userMode = 'editing';
        break;
      default:
        this.userMode = 'editing';
    }
  }
}
