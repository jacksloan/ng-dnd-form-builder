import { JsonPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, signal } from '@angular/core';
import { createDocument, DocumentIssue, FormBuilder, FormDocument } from 'ng-dnd-form-builder';

const STORAGE_KEY = 'ng-dnd-form-builder-demo';

function restore(): FormDocument | undefined {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') ?? undefined;
  } catch {
    return undefined;
  }
}

@Component({
  selector: 'app-root',
  imports: [FormBuilder, JsonPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly document = signal<FormDocument | undefined>(restore());
  protected readonly issues = signal<DocumentIssue[]>([]);

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.document()));
      } catch {
        // Private windows can block storage; the demo still works without it.
      }
    });
  }

  protected reset(): void {
    this.document.set(createDocument());
  }
}
