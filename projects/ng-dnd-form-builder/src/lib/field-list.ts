import { CdkDrag, CdkDragDrop, CdkDragHandle, CdkDragPlaceholder, CdkDropList } from '@angular/cdk/drag-drop';
import { Menu, MenuContent, MenuItem, MenuTrigger } from '@angular/aria/menu';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { idsWithin } from './commands';
import { FieldTypeDefinition } from './config';
import { findField, isGroup, showWhenOf } from './document';
import { Icon } from './icon';
import { BuilderStore } from './store';

export type DragData = { definition: FieldTypeDefinition } | { id: string };

/** One level of the canvas. Groups render another list inside their card. */
@Component({
  selector: 'dnd-field-list',
  imports: [CdkDrag, CdkDragHandle, CdkDragPlaceholder, CdkDropList, Icon, Menu, MenuContent, MenuItem, MenuTrigger],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="dnd-list"
      role="list"
      cdkDropList
      [id]="store.listId(parentId())"
      [cdkDropListConnectedTo]="connectedTo()"
      [cdkDropListData]="parentId()"
      [cdkDropListEnterPredicate]="canEnter"
      (cdkDropListDropped)="drop($event)"
    >
      @for (field of fields(); track field.id; let index = $index, last = $last) {
        <div
          class="dnd-card"
          role="listitem"
          cdkDrag
          cdkDragPreviewContainer="parent"
          [cdkDragData]="{ id: field.id! }"
          [attr.data-field-id]="field.id"
          [class.dnd-selected]="store.selectedId() === field.id"
        >
          <div class="dnd-placeholder" *cdkDragPlaceholder></div>
          <div class="dnd-card-row">
            <span class="dnd-handle" cdkDragHandle aria-hidden="true">
              <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
                <circle cx="5" cy="3" r="1.5" /><circle cx="11" cy="3" r="1.5" />
                <circle cx="5" cy="8" r="1.5" /><circle cx="11" cy="8" r="1.5" />
                <circle cx="5" cy="13" r="1.5" /><circle cx="11" cy="13" r="1.5" />
              </svg>
            </span>
            <button
              type="button"
              class="dnd-card-main"
              [attr.aria-pressed]="store.selectedId() === field.id"
              (click)="store.selectedId.set(field.id!)"
            >
              <dnd-icon [svg]="store.definition(field)?.icon ?? ''" />
              <span class="dnd-card-label">{{ store.label(field) }}</span>
              @if (field.props?.required) {
                <span class="dnd-badge">{{ m.required }}</span>
              }
              @if (showWhen(field) || field.expressions?.['hide']) {
                <span class="dnd-badge">{{ m.conditional }}</span>
              }
              @if (hasIssue(field)) {
                <span class="dnd-badge dnd-badge-issue">{{ m.hasIssue }}</span>
              }
            </button>
            <button
              type="button"
              class="dnd-icon-button"
              ngMenuTrigger
              #trigger="ngMenuTrigger"
              [menu]="menu"
              [attr.aria-label]="m.actionsFor(store.label(field))"
            >
              <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">
                <circle cx="3" cy="8" r="1.5" /><circle cx="8" cy="8" r="1.5" /><circle cx="13" cy="8" r="1.5" />
              </svg>
            </button>
            <div class="dnd-menu" ngMenu #menu="ngMenu" [hidden]="!menu.visible()" (itemSelected)="act($event, field)">
              <ng-template ngMenuContent>
                @if (index > 0) {
                  <div class="dnd-menu-item" ngMenuItem value="up">{{ m.moveUp }}</div>
                }
                @if (!last) {
                  <div class="dnd-menu-item" ngMenuItem value="down">{{ m.moveDown }}</div>
                }
                @if (parentId() !== null) {
                  <div class="dnd-menu-item" ngMenuItem value="top">{{ m.moveToTop }}</div>
                }
                @for (group of store.moveTargets(field); track group.id) {
                  <div class="dnd-menu-item" ngMenuItem [value]="'into:' + group.id">
                    {{ m.moveToGroup(store.label(group)) }}
                  </div>
                }
                <div class="dnd-menu-item" ngMenuItem value="duplicate">{{ m.duplicate }}</div>
                <div class="dnd-menu-item" ngMenuItem value="delete">{{ m.remove }}</div>
              </ng-template>
            </div>
          </div>
          @if (isGroup(field)) {
            <dnd-field-list
              class="dnd-group-body"
              [fields]="field.fieldGroup!"
              [parentId]="field.id!"
              (deleteRequest)="deleteRequest.emit($event)"
            />
          }
        </div>
      } @empty {
        <p class="dnd-empty">
          @if (parentId() === null) {
            <ng-content />
          } @else {
            {{ m.emptyGroup }}
          }
        </p>
      }
    </div>
  `,
})
export class FieldList {
  protected readonly store = inject(BuilderStore);
  protected readonly m = this.store.messages;
  protected readonly isGroup = isGroup;
  protected readonly showWhen = showWhenOf;

  readonly fields = input.required<FormlyFieldConfig[]>();
  readonly parentId = input<string | null>(null);
  readonly deleteRequest = output<string>();

  protected readonly connectedTo = computed(() => this.store.listIds().filter((id) => id !== this.store.listId(this.parentId())));

  protected hasIssue(field: FormlyFieldConfig): boolean {
    return this.store.issues().some((issue) => issue.fieldId === field.id && issue.code !== 'custom-condition');
  }

  /** A group can't be dropped into itself or anything inside it. */
  protected readonly canEnter = (drag: CdkDrag<DragData>, drop: CdkDropList<string | null>): boolean => {
    const data = drag.data;
    if (!('id' in data) || drop.data === null) return true;
    const field = findField(this.store.doc(), data.id);
    return !field || !idsWithin(field).has(drop.data);
  };

  protected drop(event: CdkDragDrop<string | null, unknown, DragData>): void {
    const data = event.item.data;
    if ('definition' in data) {
      this.store.add(data.definition, this.parentId(), event.currentIndex);
    } else {
      this.store.move(data.id, this.parentId(), event.currentIndex);
    }
  }

  protected act(action: string, field: FormlyFieldConfig): void {
    const id = field.id!;
    if (action === 'up') this.store.moveBy(id, -1);
    else if (action === 'down') this.store.moveBy(id, 1);
    else if (action === 'top') this.store.move(id, null, this.store.doc().fieldGroup.length);
    else if (action === 'duplicate') this.store.duplicate(id);
    else if (action === 'delete') this.deleteRequest.emit(id);
    else if (action.startsWith('into:')) {
      const group = findField(this.store.doc(), action.slice('into:'.length));
      if (group) this.store.move(id, group.id!, group.fieldGroup?.length ?? 0);
    }
  }
}
