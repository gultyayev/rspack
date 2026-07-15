import { test, expect } from '@/fixtures';

const COLOR_BLUE = 'rgb(10, 20, 30)';
const COLOR_RED = 'rgb(120, 0, 0)';
const COLOR_GREEN = 'rgb(0, 90, 0)';

// A chunk that hasn't been imported yet has no <link> for the HMR handler to swap, so
// it can only retain the fresh filename for later. Chunk loading (triggered here by the
// first dynamic import()) must consult that retained filename too, or it falls back to
// the stale, pre-edit one. This is the scenario rspack#6869 itself is about (lazy
// components), so it's worth its own case distinct from the always-imported one.
test('should apply a CSS edit made before the chunk owning it is ever imported', async ({
  page,
  fileAction,
}) => {
  // The chunk isn't loaded, so this edit produces nothing observable in the DOM (no
  // <link> yet) and no client-side apply() to hook - the dev-server client just settles
  // to "up to date". That log is the only client signal that the retained filename map
  // has been updated, so wait on it before importing the chunk.
  const hmrSettled = page.waitForEvent('console', {
    predicate: (msg) => msg.text().includes('up to date'),
  });

  fileAction.updateFile('src/lazy.css', (content) =>
    content.replace(COLOR_BLUE, COLOR_RED),
  );

  await hmrSettled;

  await page.click('#load');

  await expect(page.locator('body')).toHaveCSS('background-color', COLOR_RED);
  await expect(page.locator('link[rel="stylesheet"]')).toHaveCount(1);

  // Now that the chunk is loaded and owns a real <link>, a further edit must swap that
  // tag in place - the retained-map -> identity-swap handoff - not leak a second link.
  fileAction.updateFile('src/lazy.css', (content) =>
    content.replace(COLOR_RED, COLOR_GREEN),
  );
  await expect(page.locator('body')).toHaveCSS('background-color', COLOR_GREEN);
  await expect(page.locator('link[rel="stylesheet"]')).toHaveCount(1);
});
