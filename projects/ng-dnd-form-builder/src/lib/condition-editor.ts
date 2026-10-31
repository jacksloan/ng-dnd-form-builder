import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { FormlyFieldConfig } from '@ngx-formly/core';
import { conditionCandidates, hasCustomCondition } from './conditions';
import { Condition, ConditionOp, findField, showWhenOf, ShowWhen } from './document';
import { BuilderStore } from './store';

const OPS: ConditionOp[] = ['equals', 'notEquals', 'isEmpty', 'isNotEmpty', 'greaterThan', 'lessThan'];
type Option = { label: string; value: unknown };

@Component({
  selector: 'dnd-condition-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <fieldset class="dnd-conditions">
      <legend>{{ m.showWhen }}</legend>
      @if (custom()) {
        <p>{{ m.customCondition }}</p>
        <code class="dnd-code">{{ field().expressions?.['hide'] }}</code>
        <button type="button" class="dnd-button" (click)="store.setShowWhen(field().id!, null)">
          {{ m.replaceCustomCondition }}
        </button>
      } @else {
        @if (rule(); as rule) {
          @if (rule.conditions.length > 1) {
            <label class="dnd-label" [attr.for]="uid + '-match'">{{ m.conditionMatch }}</label>
            <select class="dnd-input" [id]="uid + '-match'" (change)="setMatch($any($event.target).value)">
              <option value="all" [selected]="rule.match === 'all'">{{ m.matchAll }}</option>
              <option value="any" [selected]="rule.match === 'any'">{{ m.matchAny }}</option>
            </select>
          }
          @for (condition of rule.conditions; track $index; let i = $index) {
            <div class="dnd-condition">
              <label class="dnd-label" [attr.for]="uid + '-field-' + i">{{ m.conditionField }}</label>
              <select class="dnd-input" [id]="uid + '-field-' + i" (change)="patch(i, { field: $any($event.target).value, value: undefined })">
                @for (candidate of optionsFor(condition); track candidate.id) {
                  <option [value]="candidate.id" [selected]="candidate.id === condition.field">{{ store.label(candidate) }}</option>
                }
              </select>
              <label class="dnd-label" [attr.for]="uid + '-op-' + i">{{ m.conditionOp }}</label>
              <select class="dnd-input" [id]="uid + '-op-' + i" (change)="patch(i, { op: $any($event.target).value })">
                @for (op of ops; track op) {
                  <option [value]="op" [selected]="op === condition.op">{{ m.ops[op] }}</option>
                }
              </select>
              @if (condition.op !== 'isEmpty' && condition.op !== 'isNotEmpty') {
                <label class="dnd-label" [attr.for]="uid + '-value-' + i">{{ m.conditionValue }}</label>
                @let target = targetOf(condition);
                @if (target?.type === 'checkbox') {
                  <select class="dnd-input" [id]="uid + '-value-' + i" (change)="patch(i, { value: $any($event.target).value === 'true' })">
                    <option value="true" [selected]="condition.value === true">{{ m.yes }}</option>
                    <option value="false" [selected]="condition.value === false">{{ m.no }}</option>
                  </select>
                } @else if (optionsOf(target); as options) {
                  <select class="dnd-input" [id]="uid + '-value-' + i" (change)="patch(i, { value: $any($event.target).value })">
                    @for (option of options; track option.label) {
                      <option [value]="option.value" [selected]="option.value === condition.value">{{ option.label }}</option>
                    }
                  </select>
                } @else if (target?.props?.type === 'number') {
                  <input class="dnd-input" type="number" [id]="uid + '-value-' + i" [value]="condition.value ?? ''" (change)="patch(i, { value: toNumber($any($event.target).value) })" />
                } @else {
                  <input class="dnd-input" type="text" [id]="uid + '-value-' + i" [value]="condition.value ?? ''" (change)="patch(i, { value: $any($event.target).value })" />
                }
              }
              <button type="button" class="dnd-button" (click)="removeCondition(i)">{{ m.removeCondition }}</button>
            </div>
          }
        }
        @if (candidates().length) {
          <button type="button" class="dnd-button" (click)="addCondition()">{{ m.addCondition }}</button>
        } @else {
          <p>{{ m.noCandidates }}</p>
        }
      }
    </fieldset>
  `,
})
export class ConditionEditor {
  protected readonly store = inject(BuilderStore);
  protected readonly m = this.store.messages;
  protected readonly ops = OPS;

  readonly field = input.required<FormlyFieldConfig>();

  protected get uid(): string {
    return `${this.store.uid}-rule-${this.field().id}`;
  }

  protected readonly rule = computed(() => showWhenOf(this.field()));
  protected readonly custom = computed(() => hasCustomCondition(this.field(), this.store.doc()));
  protected readonly candidates = computed(() => conditionCandidates(this.store.doc(), this.field().id!));

  /** The candidates plus whatever a condition already uses, so an existing choice stays visible. */
  protected optionsFor(condition: Condition): FormlyFieldConfig[] {
    const current = this.targetOf(condition);
    const candidates = this.candidates();
    return current && !candidates.includes(current) ? [current, ...candidates] : candidates;
  }

  protected targetOf(condition: Condition): FormlyFieldConfig | undefined {
    return findField(this.store.doc(), condition.field);
  }

  protected optionsOf(target: FormlyFieldConfig | undefined): Option[] | null {
    return (target?.props?.options as Option[] | undefined) ?? null;
  }

  protected toNumber(value: string): number | undefined {
    return value === '' ? undefined : Number(value);
  }

  private save(rule: ShowWhen): void {
    this.store.setShowWhen(this.field().id!, rule);
  }

  protected addCondition(): void {
    const rule = this.rule() ?? { match: 'all' as const, conditions: [] };
    this.save({ ...rule, conditions: [...rule.conditions, { field: this.candidates()[0].id!, op: 'isNotEmpty' }] });
  }

  protected removeCondition(index: number): void {
    const rule = this.rule()!;
    this.store.setShowWhen(
      this.field().id!,
      rule.conditions.length > 1 ? { ...rule, conditions: rule.conditions.filter((_, i) => i !== index) } : null,
    );
  }

  protected setMatch(match: ShowWhen['match']): void {
    this.save({ ...this.rule()!, match });
  }

  protected patch(index: number, change: Partial<Condition>): void {
    const rule = this.rule()!;
    this.save({ ...rule, conditions: rule.conditions.map((c, i) => (i === index ? { ...c, ...change } : c)) });
  }
}
