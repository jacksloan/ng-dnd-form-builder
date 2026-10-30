import { CdkDrag, CdkDragPlaceholder, CdkDragPreview, CdkDropList } from '@angular/cdk/drag-drop';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  linkedSignal,
  model,
  output,
  signal,
  untracked,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FormlyForm } from '@ngx-formly/core';
import { findField, FormDocument } from './document';
import { FieldList } from './field-list';
import { Icon } from './icon';
import { SettingsPanel } from './settings-panel';
import { BuilderStore } from './store';
import { DocumentIssue, validateDocument } from './validate';

/** Issues that would make Formly throw or run something unsafe if the form were rendered. */
const BLOCKS_PREVIEW: DocumentIssue['code'][] = ['unknown-type', 'unsafe-expression'];

@Component({
  selector: 'dnd-form-builder',
  imports: [
    CdkDrag,
    CdkDragPlaceholder,
    CdkDragPreview,
    CdkDropList,
    FieldList,
    FormlyForm,
    Icon,
    ReactiveFormsModule,
    SettingsPanel,
  ],
  providers: [BuilderStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrl: './form-builder.css',
  templateUrl: './form-builder.html',
  host: { class: 'dnd-builder', '(keydown)': 'shortcut($event)' },
})
export class FormBuilder {
  protected readonly store = inject(BuilderStore);
  protected readonly m = this.store.messages;
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);
  private readonly deleteDialog = viewChild<ElementRef<HTMLDialogElement>>('deleteDialog');

  /** The saved form. Leave it empty to start a new one. */
  readonly document = model<FormDocument | undefined>();
  /** Everything currently wrong with the form. The host decides whether to allow publishing. */
  readonly issues = output<DocumentIssue[]>();

  protected readonly mode = signal<'edit' | 'preview'>('edit');
  protected readonly loadIssues = signal<DocumentIssue[]>([]);
  protected readonly pendingDelete = signal<string | null>(null);
  protected readonly dependents = computed(() => {
    const id = this.pendingDelete();
    return id ? this.store.dependents(id) : [];
  });
  protected readonly pendingDeleteLabel = computed(() => {
    const id = this.pendingDelete();
    const field = id ? findField(this.store.doc(), id) : null;
    return field ? this.store.label(field) : '';
  });
  protected readonly documentIssues = computed(() => this.store.issues().filter((issue) => !issue.fieldId));
  protected readonly previewBlocked = computed(() => this.store.issues().some((issue) => BLOCKS_PREVIEW.includes(issue.code)));

  /** Formly writes into what it renders, so Preview gets a copy and a fresh form each time. */
  protected readonly preview = linkedSignal(() => {
    this.mode();
    return { form: new FormGroup({}), fields: [structuredClone(this.store.doc())], model: {} as Record<string, unknown> };
  });
  protected readonly previewData = signal<Record<string, unknown>>({});
  protected readonly previewJson = computed(() => JSON.stringify(this.previewData(), null, 2));

  constructor() {
    effect(() => {
      const incoming = this.document();
      untracked(() => {
        if (incoming === undefined) {
          this.loadIssues.set([]);
          this.document.set(this.store.doc());
          return;
        }
        if (incoming === this.store.doc()) return;
        const fatal = validateDocument(incoming, this.store.knownTypes).filter((issue) => issue.fatal);
        this.loadIssues.set(fatal);
        if (fatal.length) {
          this.issues.emit(fatal);
          return;
        }
        this.store.load(incoming);
      });
    });

    effect(() => {
      const doc = this.store.doc();
      const issues = this.store.issues();
      untracked(() => {
        if (this.loadIssues().length) return;
        if (this.document() !== undefined && this.document() !== doc) this.document.set(doc);
        this.issues.emit(issues);
      });
    });

    effect(() => {
      const id = this.store.focusRequest();
      if (!id) return;
      untracked(() => this.store.focusRequest.set(null));
      afterNextRender(() => this.focusCard(id), { injector: this.injector });
    });

    effect(() => {
      const dialog = this.deleteDialog()?.nativeElement;
      if (this.pendingDelete() && dialog && !dialog.open) dialog.showModal();
    });
  }

  private focusCard(id: string): void {
    this.host.nativeElement.querySelector<HTMLElement>(`[data-field-id="${CSS.escape(id)}"] .dnd-card-main`)?.focus();
  }

  protected readonly neverEnter = (): boolean => false;

  protected requestDelete(id: string): void {
    if (this.store.dependents(id).length) this.pendingDelete.set(id);
    else this.delete(id);
  }

  protected confirmDelete(): void {
    const id = this.pendingDelete();
    this.closeDelete();
    if (id) this.delete(id);
  }

  protected closeDelete(): void {
    this.deleteDialog()?.nativeElement.close();
    this.pendingDelete.set(null);
  }

  private delete(id: string): void {
    this.store.remove(id);
    afterNextRender(
      () => this.host.nativeElement.querySelector<HTMLElement>('.dnd-canvas-heading')?.focus(),
      { injector: this.injector },
    );
  }

  /** Text fields keep their own native undo. */
  protected shortcut(event: KeyboardEvent): void {
    if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'z') return;
    if ((event.target as HTMLElement).matches('input, textarea, select')) return;
    event.preventDefault();
    if (event.shiftKey) this.store.redo();
    else this.store.undo();
  }
}
