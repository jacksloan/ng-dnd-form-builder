import { expect, Locator, Page } from '@playwright/test';

export const palette = (page: Page, name: string) =>
  page.locator('.dnd-palette').getByRole('button', { name, exact: true });
export const card = (page: Page, label: string) =>
  page.locator('.dnd-card').filter({ has: page.locator(`.dnd-card-main:has-text("${label}")`) }).last();
export const list = (container: Locator) => container.locator('.dnd-list').first();

async function dragTo(page: Page, from: Locator, to: Locator, where: 'center' | 'top' = 'center') {
  const start = (await from.boundingBox())!;
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(start.x + start.width / 2 + 8, start.y + start.height / 2 + 8, { steps: 4 });
  // Placeholders shift the layout on the way, so keep re-aiming at the target, as a person would.
  for (let i = 0; i < 3; i++) {
    const end = (await to.boundingBox())!;
    const y = where === 'top' ? end.y + 4 : end.y + end.height / 2;
    await page.mouse.move(end.x + end.width / 2, y, { steps: 10 });
    await page.waitForTimeout(100);
  }
  await page.mouse.up();
  await page.waitForTimeout(350);
}

export const dragFromPalette = (page: Page, name: string, to: Locator, where: 'center' | 'top' = 'center') =>
  dragTo(page, palette(page, name), to, where);
export const dragCard = (page: Page, label: string, to: Locator, where: 'center' | 'top' = 'center') =>
  dragTo(page, card(page, label).locator('.dnd-handle').first(), to, where);

export async function savedDocument(page: Page) {
  const summary = page.getByText(/^Saved document/);
  const pre = page.getByTestId('document');
  if (!(await pre.isVisible())) await summary.click();
  return JSON.parse((await pre.textContent())!);
}

/** The document's shape, as nested labels. */
export function outline(fields: any[]): unknown[] {
  return fields.map((f) => (f.fieldGroup ? { [f.props.label]: outline(f.fieldGroup) } : f.props.label));
}

export async function rename(page: Page, label: string) {
  const input = page.locator('.dnd-settings').getByLabel('Label', { exact: true });
  await input.fill(label);
  await input.press('Tab');
  await expect(page.locator('.dnd-selected .dnd-card-main').first()).toContainText(label);
}
