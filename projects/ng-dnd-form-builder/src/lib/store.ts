import { LiveAnnouncer } from '@angular/cdk/a11y';
import { computed, inject, Injectable, signal } from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { addField, duplicateField, FieldPatch, idsWithin, locate, moveField, removeField, setShowWhen, uniqueKey, updateField } from './commands';
import { definitionFor, FieldTypeDefinition, FORM_BUILDER_CONFIG, GROUP_TYPE } from './config';
import { dependentsOf } from './conditions';
import { allFields, createDocument, findField, FormDocument, isGroup, ShowWhen } from './document';
import { validateDocument } from './validate';

const HISTORY_LIMIT = 50;
let nextBuilderId = 0;

@Injectable()
export class BuilderStore {
  private readonly announcer = inject(LiveAnnouncer);
  readonly config = inject(FORM_BUILDER_CONFIG);
  readonly messages = this.config.messages;
  /** Keeps drop list ids unique when a page has more than one builder. */
  readonly uid = `dnd-${nextBuilderId++}`;

  readonly doc = signal<FormDocument>(createDocument());
  readonly selectedId = signal<string | null>(null);
  /** The field whose card should take focus after the next render. */
  readonly focusRequest = signal<string | null>(null);
  private readonly past = signal<FormDocument[]>([]);
  private readonly future = signal<FormDocument[]>([]);

  readonly canUndo = computed(() => this.past().length > 0);
  readonly canRedo = computed(() => this.future().length > 0);
  readonly selected = computed(() => {
    const id = this.selectedId();
    return id ? (findField(this.doc(), id) ?? null) : null;
  });
  readonly knownTypes = new Set(this.config.definitions.map((d) => d.type));
  readonly issues = computed(() => validateDocument(this.doc(), this.knownTypes));
  readonly groups = computed(() => allFields(this.doc()).filter(isGroup));
  readonly paletteId = `${this.uid}-palette`;
  /** Inner lists first, so a drop over a nested group lands in the group and not the list around it. */
  readonly listIds = computed(() => [...this.groups().map((g) => this.listId(g.id!)).reverse(), this.listId(null)]);

  listId(parentId: string | null): string {
    return `${this.uid}-list-${parentId ?? 'root'}`;
  }

  definition(field: FormlyFieldConfig): FieldTypeDefinition | undefined {
    return definitionFor(this.config.definitions, field);
  }

  label(field: FormlyFieldConfig): string {
    return String(field.props?.label || this.definition(field)?.label || field.type || field.id);
  }

  /** Replaces the document from outside. History belongs to the old document, so it resets. */
  load(doc: FormDocument): void {
    this.doc.set(doc);
    this.past.set([]);
    this.future.set([]);
    this.selectedId.set(null);
  }

  private apply(next: FormDocument): void {
    const current = this.doc();
    if (next === current) return;
    this.past.update((past) => [...past, current].slice(-HISTORY_LIMIT));
    this.future.set([]);
    this.doc.set(next);
  }

  undo(): void {
    const past = this.past();
    if (!past.length) return;
    this.future.update((future) => [this.doc(), ...future]);
    this.past.set(past.slice(0, -1));
    this.doc.set(past[past.length - 1]);
    this.announcer.announce(this.messages.undone);
  }

  redo(): void {
    const [next, ...rest] = this.future();
    if (!next) return;
    this.past.update((past) => [...past, this.doc()]);
    this.future.set(rest);
    this.doc.set(next);
    this.announcer.announce(this.messages.redone);
  }

  private create(definition: FieldTypeDefinition): FormlyFieldConfig {
    const id = crypto.randomUUID();
    const props = { label: definition.label, ...structuredClone(definition.defaults?.props ?? {}) };
    if (definition.type === GROUP_TYPE) return { id, props, fieldGroup: [] };
    return { id, key: uniqueKey(this.doc(), definition.label), type: definition.type, props };
  }

  add(definition: FieldTypeDefinition, parentId: string | null, index: number): void {
    const field = this.create(definition);
    this.apply(addField(this.doc(), field, parentId, index));
    this.selectedId.set(field.id!);
    this.announcer.announce(this.messages.added(definition.label, index + 1));
  }

  /** Adds after the selection, or inside it when a group is selected. */
  addAfterSelection(definition: FieldTypeDefinition): void {
    const doc = this.doc();
    const selected = this.selected();
    if (selected && isGroup(selected)) return this.add(definition, selected.id!, selected.fieldGroup!.length);
    const place = selected ? locate(doc, selected.id!) : null;
    if (place) return this.add(definition, place.parentId, place.index + 1);
    this.add(definition, null, doc.fieldGroup.length);
  }

  move(id: string, parentId: string | null, index: number): void {
    const field = findField(this.doc(), id);
    if (!field) return;
    this.apply(moveField(this.doc(), id, parentId, index));
    this.selectedId.set(id);
    this.focusRequest.set(id);
    this.announcer.announce(this.messages.moved(this.label(field), index + 1));
  }

  moveBy(id: string, delta: number): void {
    const place = locate(this.doc(), id);
    if (place) this.move(id, place.parentId, place.index + delta);
  }

  /** Groups this field can move into: not itself or anything inside it. */
  moveTargets(field: FormlyFieldConfig): FormlyFieldConfig[] {
    const within = idsWithin(field);
    const parentId = locate(this.doc(), field.id!)?.parentId;
    return this.groups().filter((group) => !within.has(group.id!) && group.id !== parentId);
  }

  /** Fields that would lose a condition if this one were deleted. */
  dependents(id: string): FormlyFieldConfig[] {
    const field = findField(this.doc(), id);
    return field ? dependentsOf(this.doc(), idsWithin(field)) : [];
  }

  remove(id: string): void {
    const field = findField(this.doc(), id);
    if (!field) return;
    this.apply(removeField(this.doc(), id));
    if (this.selected() === null) this.selectedId.set(null);
    this.announcer.announce(this.messages.removed(this.label(field)));
  }

  duplicate(id: string): void {
    const field = findField(this.doc(), id);
    const place = locate(this.doc(), id);
    if (!field || !place) return;
    this.apply(duplicateField(this.doc(), id, () => crypto.randomUUID()));
    this.announcer.announce(this.messages.duplicated(this.label(field)));
  }

  update(id: string, patch: FieldPatch): void {
    const field = findField(this.doc(), id);
    if (field) this.apply(updateField(this.doc(), id, patch, this.definition(field)?.label));
  }

  setShowWhen(id: string, showWhen: ShowWhen | null): void {
    this.apply(setShowWhen(this.doc(), id, showWhen));
  }
}
