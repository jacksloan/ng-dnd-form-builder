import AxeBuilder from '@axe-core/playwright';
import { expect, Page, test } from '@playwright/test';
import { outline, palette, rename, savedDocument } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

/** Tabs until an element matching the predicate has focus, so nothing here can use the mouse. */
async function tabTo(page: Page, name: string, shift = false) {
  for (let i = 0; i < 200; i++) {
    await page.keyboard.press(shift ? 'Shift+Tab' : 'Tab');
    const focused = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return '';
      const label = el.id ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`)?.textContent : '';
      return (el.getAttribute('aria-label') ?? label ?? '').trim() || (el.textContent ?? '').trim();
    });
    if (focused === name || focused.startsWith(name)) return;
  }
  throw new Error(`Couldn't tab to ${name}`);
}

async function type(page: Page, field: string, text: string) {
  await tabTo(page, field);
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type(text);
  await page.keyboard.press('Tab');
}

async function menuAction(page: Page, cardLabel: string, action: string) {
  await tabTo(page, `Actions for ${cardLabel}`);
  await page.keyboard.press('Enter');
  const item = page.locator('.dnd-menu:not([hidden]) .dnd-menu-item', { hasText: action });
  await expect(item).toBeVisible();
  for (let i = 0; i < 12; i++) {
    if (await item.evaluate((el) => el === document.activeElement || el.getAttribute('tabindex') === '0')) break;
    await page.keyboard.press('ArrowDown');
  }
  await page.keyboard.press('Enter');
}

test('builds a complete form with only the keyboard', async ({ page }) => {
  await tabTo(page, 'Checkbox');
  await page.keyboard.press('Enter');
  await expect(page.locator('.dnd-selected')).toContainText('Checkbox');
  await type(page, 'Label', 'Has pet');

  await tabTo(page, 'Group', true);
  await page.keyboard.press('Enter');
  await expect(page.locator('.dnd-selected')).toContainText('Group');
  await type(page, 'Label', 'Details');

  // The group is selected, so the next field lands inside it.
  await tabTo(page, 'Text', true);
  await page.keyboard.press('Enter');
  await expect(page.locator('.dnd-selected').last()).toContainText('Text');
  await type(page, 'Label', 'Pet name');
  await page.keyboard.press('Tab');

  await tabTo(page, 'Add condition');
  await page.keyboard.press('Enter');
  await tabTo(page, 'Comparison');
  // A focused native select. How its keys behave is up to the OS, so set the choice directly.
  await page.getByLabel('Comparison').selectOption('equals');
  await expect(page.getByLabel('Value', { exact: true })).toBeVisible();

  let doc = await savedDocument(page);
  expect(outline(doc.fieldGroup)).toEqual(['Has pet', { Details: ['Pet name'] }]);
  expect(doc.fieldGroup[1].fieldGroup[0].key).toBe('petName');
  expect(doc.fieldGroup[1].fieldGroup[0].props.showWhen.conditions[0].op).toBe('equals');
  expect(doc.fieldGroup[1].fieldGroup[0].expressions.hide).toContain('model["hasPet"]');

  const shape = () => expect.poll(async () => outline((await savedDocument(page)).fieldGroup));

  await menuAction(page, 'Pet name', 'Move out of group');
  await shape().toEqual(['Has pet', { Details: [] }, 'Pet name']);
  // Focus follows the moved card.
  await expect(page.locator('.dnd-card-main:focus')).toContainText('Pet name');

  await menuAction(page, 'Pet name', 'Move up');
  await shape().toEqual(['Has pet', 'Pet name', { Details: [] }]);

  await page.keyboard.press('ControlOrMeta+z');
  await shape().toEqual(['Has pet', { Details: [] }, 'Pet name']);
  await page.keyboard.press('ControlOrMeta+Shift+z');
  await shape().toEqual(['Has pet', 'Pet name', { Details: [] }]);

  // Deleting a referenced field asks first, then undo restores the rule.
  await menuAction(page, 'Has pet', 'Delete');
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Delete Has pet?');
  await expect(dialog).toContainText('Pet name');
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await shape().toHaveLength(3);

  await menuAction(page, 'Has pet', 'Delete');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Tab');
  await page.keyboard.press('Enter');
  await shape().toEqual(['Pet name', { Details: [] }]);
  doc = await savedDocument(page);
  expect(doc.fieldGroup[0].props.showWhen).toBeUndefined();
  expect(doc.fieldGroup[0].expressions).toBeUndefined();
  // Focus lands somewhere useful after the deleted card is gone.
  await expect(page.locator('.dnd-canvas-heading')).toBeFocused();
  await page.keyboard.press('ControlOrMeta+z');
  await expect.poll(async () => (await savedDocument(page)).fieldGroup[1].props.showWhen).toBeDefined();
});

test('announces changes to screen readers', async ({ page }) => {
  await page.locator('.dnd-palette').getByRole('button', { name: 'Text', exact: true }).click();
  const announcer = page.locator('.cdk-live-announcer-element');
  await expect(announcer).toHaveText('Text added at position 1');
  expect((await announcer.boundingBox())!.width).toBeLessThanOrEqual(1);
});

test('previews with Material, keeps data flat, and hides conditional fields', async ({ page }) => {
  const add = async (name: string) => {
    await palette(page, name).click();
    await expect(page.locator('.dnd-selected').last()).toContainText(name);
  };
  await add('Text');
  await rename(page, 'Pet');
  await add('Group');
  await add('Text');
  await rename(page, 'Name');
  await page.getByRole('button', { name: 'Add condition' }).click();

  await page.getByRole('button', { name: 'Preview' }).click();
  await expect(page.locator('.dnd-preview mat-form-field')).toHaveCount(1);
  await page.locator('.dnd-preview input').first().fill('Yes');
  await expect(page.locator('.dnd-preview mat-form-field')).toHaveCount(2);
  await page.locator('.dnd-preview input').nth(1).fill('Rex');
  await expect(page.locator('.dnd-preview pre')).toContainText('"name": "Rex"');
  await page.locator('.dnd-preview input').first().fill('');
  await expect(page.locator('.dnd-preview mat-form-field')).toHaveCount(1);
  await expect(page.locator('.dnd-preview pre')).not.toContainText('Rex');
});

test('offers a custom field type registered by the host', async ({ page }) => {
  await page.locator('.dnd-palette').getByRole('button', { name: 'Rating', exact: true }).click();
  await page.getByRole('button', { name: 'Preview' }).click();
  await expect(page.locator('app-rating-field input[type=radio]')).toHaveCount(5);
});

test('refuses a broken document and a newer one', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ng-dnd-form-builder-demo', '{"props":{"schemaVersion":2},"fieldGroup":[]}'));
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText('newer version');
});

test('keeps unknown field types and blocks previewing them', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('ng-dnd-form-builder-demo', JSON.stringify({ props: { schemaVersion: 1 }, fieldGroup: [{ id: 'x', key: 'x', type: 'mystery', props: { label: 'Mystery' } }] })),
  );
  await page.goto('/');
  await expect(page.locator('.dnd-card')).toContainText('Mystery');
  await expect(page.locator('.dnd-card')).toContainText('Needs attention');
  await page.getByRole('button', { name: 'Preview' }).click();
  await expect(page.getByRole('alert')).toContainText('safely');
  expect((await savedDocument(page)).fieldGroup[0].type).toBe('mystery');
});

test('works at phone width', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.locator('.dnd-palette').getByRole('button', { name: 'Text', exact: true }).click();
  await expect(page.locator('.dnd-settings')).toBeVisible();
  await page.getByRole('button', { name: 'Close settings' }).click();
  await expect(page.locator('.dnd-settings')).toBeHidden();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

for (const colorScheme of ['light', 'dark'] as const) {
  test(`has no automatically detectable accessibility issues (${colorScheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    await palette(page, 'Text').click();
    await expect(page.locator('.dnd-card')).toHaveCount(1);
    await palette(page, 'Group').click();
    await expect(page.locator('.dnd-card')).toHaveCount(2);
    await palette(page, 'Radio buttons').click();
    await expect(page.locator('.dnd-card')).toHaveCount(3);
    await page.getByRole('button', { name: 'Add condition' }).first().click();
    await expect(page.getByLabel('Comparison')).toBeVisible();
    let results = await new AxeBuilder({ page }).include('dnd-form-builder').analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes[0].html}`)).toEqual([]);

    await page.getByRole('button', { name: /^Actions for/ }).first().click();
    results = await new AxeBuilder({ page }).include('dnd-form-builder').analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes[0].html}`)).toEqual([]);
  });
}
