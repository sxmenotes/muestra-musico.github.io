import { test, expect } from '@playwright/test';

test('landing loads without errors and fits the viewport', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('h1')).toContainText('El amor también');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2200);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator('img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
  await page.screenshot({ path: `test-results/landing-${test.info().project.name}.png`, fullPage: false });
  expect(errors).toEqual([]);
});

test('audio switches tracks and stops on request', async ({ page }) => {
  await page.goto('/');
  const first = page.locator('[data-track="0"]');
  const second = page.locator('[data-track="1"]');
  await first.click();
  await expect(first).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#player-status')).toContainText('Sonando: Donde empieza todo');
  await expect.poll(async () => Number(await page.locator('[role="progressbar"]').getAttribute('aria-valuenow'))).toBeGreaterThan(0);
  await second.click();
  await expect(first).toHaveAttribute('aria-pressed', 'false');
  await expect(second).toHaveAttribute('aria-pressed', 'true');
  await second.click();
  await expect(second).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#player-status')).toContainText('Música detenida');
});

test('form validates and presents an honest local demonstration', async ({ page }) => {
  await page.goto('/');
  await page.locator('#names').fill('Ana y Mateo');
  await page.locator('#date').fill('2028-06-15');
  await page.locator('#location').fill('Buenos Aires');
  await page.locator('#email').fill('pareja@example.com');
  await page.getByRole('button', { name: 'Imaginar nuestra banda sonora' }).click();
  await expect(page.locator('#form-status')).toContainText('Ana y Mateo');
  await expect(page.locator('#form-status')).toContainText('no se envió ningún mensaje');
});

test('FAQ, reduced motion, and mobile menu are accessible', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('h1')).toBeVisible();
  if (testInfo.project.name === 'mobile') {
    const menu = page.locator('.menu-toggle');
    await menu.click();
    await expect(menu).toHaveAttribute('aria-expanded', 'true');
    await page.locator('#navigation a[href="#momentos"]').click();
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
    await expect(page).toHaveURL(/#momentos$/);
  }
  const question = page.locator('summary').filter({ hasText: '¿Dónde puedes acompañarnos?' });
  await question.click();
  await expect(page.getByText('Mi punto de partida es Buenos Aires', { exact: false })).toBeVisible();
  await page.screenshot({ path: `test-results/full-${testInfo.project.name}.png`, fullPage: true });
});


test('home links and reload show the entire header at the top', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('.site-footer .wordmark').click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator('.site-header')).toBeInViewport({ ratio: 1 });

  await page.locator('.back-top').click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

  await page.evaluate(() => window.scrollTo({ top: 300, behavior: 'instant' }));
  await page.locator('.site-header .wordmark').click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);

  await page.evaluate(() => window.scrollTo({ top: 1800, behavior: 'instant' }));
  await page.reload();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator('.site-header')).toBeInViewport({ ratio: 1 });

  await page.goto('/#momentos');
  await expect(page.locator('#momentos')).toBeInViewport();
  await page.reload();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await expect(page.locator('.site-header')).toBeInViewport({ ratio: 1 });
  await expect(page).not.toHaveURL(/#/);
});

test('readable text sizes and reflow with enlarged text', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const undersized = await page.locator('body *').evaluateAll(elements => elements.filter(element => {
    if (element.closest('[aria-hidden="true"]') || !element.checkVisibility()) return false;
    const hasText = [...element.childNodes].some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim());
    return hasText && parseFloat(getComputedStyle(element).fontSize) < 12;
  }).map(element => element.className));
  expect(undersized).toEqual([]);
  const bodySizes = await page.locator('.hero-description, .story-copy p, .moment-card > p, .form-field input, .form-field textarea').evaluateAll(elements => elements.map(element => parseFloat(getComputedStyle(element).fontSize)));
  expect(bodySizes.every(size => size >= 16)).toBe(true);
  const footerSizes = await page.locator('.footer-about > p:not(.footer-location), .footer-nav a, .footer-whatsapp, .footer-socials button').evaluateAll(elements => elements.map(element => parseFloat(getComputedStyle(element).fontSize)));
  expect(footerSizes.every(size => size >= 14 && size < 16)).toBe(true);
  for (const width of [320, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
    const overflow = await page.evaluate(() => ({ width: innerWidth, scroll: document.documentElement.scrollWidth, elements: [...document.querySelectorAll('body *')].filter(e => e.checkVisibility() && e.getBoundingClientRect().right > innerWidth + 1).map(e => ({ tag: e.tagName, cls: e.className, parent: e.parentElement.className, text: e.textContent.slice(0,80), right: e.getBoundingClientRect().right })) }));
    expect(overflow.scroll <= overflow.width, JSON.stringify(overflow)).toBe(true);
    await expect(page.locator('.contact-form button')).toBeVisible();
  }
  await page.screenshot({ path: `test-results/enlarged-${testInfo.project.name}.png`, fullPage: true });
});

test('footer demo channels are accessible and stay on the site', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const footer = page.locator('.site-footer');
  await footer.scrollIntoViewIfNeeded();
  await page.screenshot({ path: `test-results/footer-${testInfo.project.name}.png`, fullPage: false });
  for (const channel of ['WhatsApp', 'Instagram', 'YouTube', 'Spotify']) {
    const trigger = footer.locator(`[data-social="${channel}"]`);
    await trigger.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('#social-description')).toContainText(channel);
    await expect(page.locator('#social-description')).toContainText('no está vinculado a una cuenta real');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(trigger).toBeFocused();
  }
  await footer.locator('[data-social="WhatsApp"]').click();
  await page.getByRole('link', { name: 'Explorar el formulario' }).click();
  await expect(page).toHaveURL(/#contacto$/);
  await expect(page.getByRole('dialog')).not.toBeVisible();
});

test('hero playback shares state with the playlist and supports reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const play = page.locator('.hero-play-button');
  await play.click();
  await expect(play).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-track="0"]')).toHaveAttribute('aria-pressed', 'true');
  await play.click();
  await expect(play).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('[data-track="0"]')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('[data-track="0"]').click();
  await expect(play).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-track="1"]').click();
  await expect(play).toHaveAttribute('aria-pressed', 'false');
});
