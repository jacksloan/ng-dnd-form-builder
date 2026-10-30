import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/** Renders an icon from the developer's field type registry, never from document data. */
@Component({
  selector: 'dnd-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="dnd-icon" [innerHTML]="html()"></span>`,
})
export class Icon {
  private readonly sanitizer = inject(DomSanitizer);
  readonly svg = input<string>('');
  protected readonly html = computed(() => this.sanitizer.bypassSecurityTrustHtml(this.svg()));
}
