import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DndFormService } from './dnd-form.service';
import { DnDFormConfig } from './model';

@Component({
  selector: 'dnd-form',
  providers: [DndFormService],
  template: ` <ng-content></ng-content> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DndFormComponent {
  constructor(public service: DndFormService) {}

  public fields$ = this.service.fields$;

  addItem(config: DnDFormConfig) {
    this.service.addItem(config);
  }

  updateFormLabel(config: DnDFormConfig, newLabel: string) {
    this.service.updateFormLabel(config, newLabel);
  }
}
