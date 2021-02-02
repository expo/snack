import { Page } from 'puppeteer';

declare const page: Page;

it('clicking search button shows search dialog', async () => {
  const button = '[data-test-id="search-button"]';
  const input = '[data-test-id="search-input"]';
  const close = '[data-test-id="modal-close"]';

  await page.waitForSelector(button);
  await page.click(button);
  await page.waitForSelector(input);
  await page.type(input, 'Hello world');
  await page.waitForSelector(close);
  await page.click(close);
});
