import { test, expect } from '@/fixtures';

const COLOR_BLUE = 'rgb(10, 20, 30)';
const COLOR_RED = 'rgb(120, 0, 0)';
const COLOR_GREEN = 'rgb(0, 90, 0)';

// splitChunks hoists the CSS into one shared `style` chunk that the hot update lists
// alongside `main`, while the content-hashed filename makes the stylesheet href change
// on every edit. Deduplicating the update by href must not drop it across repeated
// edits, and only a single <link> may ever be installed.
test('should keep updating a shared, content-hashed stylesheet across repeated edits', async ({
  page,
  fileAction,
}) => {
  const links = page.locator('link[rel="stylesheet"]');
  await expect(page.locator('body')).toHaveCSS('background-color', COLOR_BLUE);
  await expect(links).toHaveCount(1);

  fileAction.updateFile('src/index.css', (content) =>
    content.replace(COLOR_BLUE, COLOR_RED),
  );
  await expect(page.locator('body')).toHaveCSS('background-color', COLOR_RED);
  await expect(links).toHaveCount(1);

  // The second edit is the one that regressed for the plain hashed case: the tag now
  // carries a hashed href that no longer matches the build-time literal, so the handoff
  // must keep working - and still only one link.
  fileAction.updateFile('src/index.css', (content) =>
    content.replace(COLOR_RED, COLOR_GREEN),
  );
  await expect(page.locator('body')).toHaveCSS('background-color', COLOR_GREEN);
  await expect(links).toHaveCount(1);
});
