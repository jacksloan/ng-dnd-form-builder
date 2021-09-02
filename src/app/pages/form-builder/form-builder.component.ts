import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-form-builder',
  template: `
  <mat-toolbar>Drag and Drop Form Builder</mat-toolbar>
  <app-drag-drop-form></app-drag-drop-form>
  `,
})
export class FormBuilderComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
