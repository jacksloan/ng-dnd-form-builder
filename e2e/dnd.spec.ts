import { expect, test } from '@playwright/test';
import { card, dragCard, dragFromPalette, list, outline, palette, rename, savedDocument } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('drags from the palette onto the canvas and keeps the palette intact', async ({ page }) => {
  const canvas = page.locator('.dnd-canvas .dnd-list').first();
  await dragFromPalette(page, 'Text', canvas);
  await expect(page.locator('.dnd-card')).toHaveCount(1);
  await expect(page.locator('.dnd-palette-item')).toHaveCount(10);
  await dragFromPalette(page, 'Number', canvas);
  await expect(page.locator('.dnd-card')).toHaveCount(2);
});

test('palette to group, moves between groups, and three levels of nesting', async ({ page }) => {
  const canvas = page.locator('.dnd-canvas .dnd-list').first();
  // Level 1
  await dragFromPalette(page, 'Group', canvas);
  await rename(page, 'One');
  // Level 2, dropped into the group
  await dragFromPalette(page, 'Group', list(card(page, 'One')));
  await rename(page, 'Two');
  // Level 3
  await dragFromPalette(page, 'Group', list(card(page, 'Two')));
  await rename(page, 'Three');
  await dragFromPalette(page, 'Text', list(card(page, 'Three')));
  await rename(page, 'Deep');
  expect(outline((await savedDocument(page)).fieldGroup)).toEqual([{ One: [{ Two: [{ Three: ['Deep'] }] }] }]);

  // A move out to a shallower group
  await dragCard(page, 'Deep', list(card(page, 'One')), 'top');
  const moved = outline((await savedDocument(page)).fieldGroup) as any[];
  expect(JSON.stringify(moved)).toContain('"One":[');
  expect(moved[0].One).toContain('Deep');
  expect(moved[0].One.find((x: unknown) => typeof x === 'object').Two).toEqual([{ Three: [] }]);

  // And back into the deepest
  await dragCard(page, 'Deep', list(card(page, 'Three')));
  expect(outline((await savedDocument(page)).fieldGroup)).toEqual([{ One: [{ Two: [{ Three: ['Deep'] }] }] }]);
});

test('reorders within a list', async ({ page }) => {
  const canvas = page.locator('.dnd-canvas .dnd-list').first();
  await dragFromPalette(page, 'Text', canvas);
  await rename(page, 'A');
  await dragFromPalette(page, 'Number', canvas);
  await rename(page, 'B');
  // Aim at the list, because the card itself moves once they swap.
  await dragCard(page, 'B', canvas, 'top');
  expect(outline((await savedDocument(page)).fieldGroup)).toEqual(['B', 'A']);
});

test('refuses to drop a group into itself', async ({ page }) => {
  const canvas = page.locator('.dnd-canvas .dnd-list').first();
  await dragFromPalette(page, 'Group', canvas);
  await rename(page, 'Outer');
  await dragFromPalette(page, 'Group', list(card(page, 'Outer')));
  await rename(page, 'Inner');
  await dragCard(page, 'Outer', list(card(page, 'Inner')));
  expect(outline((await savedDocument(page)).fieldGroup)).toEqual([{ Outer: [{ Inner: [] }] }]);
});

test('drops land in a nested group wherever the pointer is inside it, with siblings around it', async ({ page }) => {
  const canvas = page.locator('.dnd-canvas .dnd-list').first();
  await dragFromPalette(page, 'Checkbox', canvas);
  await rename(page, 'Above');
  await dragFromPalette(page, 'Group', canvas);
  await rename(page, 'G');
  await dragFromPalette(page, 'Number', canvas);
  await rename(page, 'Below');
  await expect.poll(async () => (await savedDocument(page)).fieldGroup.length).toBe(3);

  // No matter what order they landed in, the group is what's being aimed at.
  const group = card(page, 'G');
  await dragFromPalette(page, 'Text', list(group));
  await rename(page, 'First');
  const inGroup = async () => (await savedDocument(page)).fieldGroup.find((f: any) => f.fieldGroup).fieldGroup.length;
  await expect.poll(inGroup).toBe(1);

  for (const [i, fraction] of [0.15, 0.85].entries()) {
    const box = (await list(group).boundingBox())!;
    const start = (await palette(page, 'Email').boundingBox())!;
    await page.mouse.move(start.x + 20, start.y + 10);
    await page.mouse.down();
    await page.mouse.move(start.x + 40, start.y + 20, { steps: 4 });
    await page.mouse.move(box.x + box.width / 2, box.y + box.height * fraction, { steps: 12 });
    await page.waitForTimeout(100);
    await page.mouse.up();
    await expect.poll(inGroup).toBe(i + 2);
  }
  expect((await savedDocument(page)).fieldGroup).toHaveLength(3);
});

test('moves a card from the top level into a group below it', async ({ page }) => {
  const canvas = page.locator('.dnd-canvas .dnd-list').first();
  await dragFromPalette(page, 'Group', canvas);
  await rename(page, 'G');
  await dragFromPalette(page, 'Text', canvas, 'top');
  await rename(page, 'Mover');
  await expect.poll(async () => outline((await savedDocument(page)).fieldGroup)).toEqual(['Mover', { G: [] }]);
  await dragCard(page, 'Mover', list(card(page, 'G')));
  await expect.poll(async () => outline((await savedDocument(page)).fieldGroup)).toEqual([{ G: ['Mover'] }]);
});
