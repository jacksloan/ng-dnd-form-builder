import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-form-builder',
  template: `
    <mat-toolbar class="flex flex-row justify-between">
      <span>Drag and Drop Form Builder</span>
      <button mat-icon-button (click)="togglePreview()">
        <mat-icon [matTooltip]="(userModeTooltip$ | async) || ''">
          {{ userModeIcon$ | async }}
        </mat-icon>
      </button>
    </mat-toolbar>
    <app-material-example></app-material-example>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FormBuilderComponent {
  showPreview$ = new BehaviorSubject(true);

  userMode$: Observable<'editing' | 'preview'> = this.showPreview$.pipe(
    map((show) => {
      if (show) return 'preview';
      else return 'editing';
    })
  );
  userModeIcon$ = this.showPreview$.pipe(
    map((show) => (show ? 'visibility' : 'visibility_off'))
  );

  userModeTooltip$ = this.showPreview$.pipe(
    map((show) => (show ? 'Hide Preview' : 'Show Preview'))
  );

  togglePreview() {
    this.showPreview$.next(!this.showPreview$.value);
  }
}
