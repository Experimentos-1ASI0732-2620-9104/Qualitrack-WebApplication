import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';

const origin = process.env.WEB_URL ?? 'http://localhost:4200';
const directory = process.env.OUTPUT_DIR ?? 'test-results/report-tests';
const english = JSON.parse(await readFile('public/i18n/en.json', 'utf8'));
const spanish = JSON.parse(await readFile('public/i18n/es.json', 'utf8'));
await mkdir(directory, { recursive: true });

/** The content does not matter here: the test checks that the file the platform stored is the one downloaded. */
const pdfOf = (name) => Buffer.from(`%PDF-1.4\n% ${name}\n%%EOF\n`);
const contents = { 71: pdfOf('batch'), 72: pdfOf('compliance'), 73: pdfOf('equipment') };

const browser = await chromium.launch();
try {
  for (const width of [1440, 1100, 375, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 960 }, acceptDownloads: true });
    await context.addInitScript(() => {
      localStorage.setItem('token', 'test.' + btoa(JSON.stringify({ exp: Date.now() / 1000 + 3600 })) + '.test');
      localStorage.setItem('userId', '27');
      localStorage.setItem('username', 'Report fixture');
      localStorage.setItem('roles', '["ROLE_QA_MANAGER"]');
    });
    let reportStatus = 201;
    const created = [];
    // All API traffic is isolated. No test token or fixture record reaches the running backend.
    await context.route('**/api/v1/**', async (route) => {
      const request = route.request();
      const path = new URL(request.url()).pathname.replace(/^.*\/api\/v1/, '');
      let body = [];
      let status = 200;
      if (path === '/users/me/onboarding') body = { userId: 27, laboratoryId: 42, subscriptionId: 73, subscriptionStatus: 'ACTIVE', nextStep: 'READY' };
      else if (path === '/users/me/profile') body = { userId: 27, staffId: null, username: 'fixture', email: null, roles: [], fullName: 'Report Fixture', dni: null, phoneNumber: null, location: null, position: null, hasPhoto: false };
      else if (path === '/users/me/notifications/unread-count') body = { unreadCount: 0 };
      else if (path === '/laboratories/42') body = { id: 42, name: 'Multilab', ownerId: 27 };
      else if (path === '/laboratories/42/environments') body = [{ id: 1, code: 'PROD-01', name: 'Production room', usage: 'PRODUCTION' }];
      else if (path === '/laboratories/42/batches') body = [{ id: 5, environmentId: 1, productId: 3, productName: 'Demo product', batchNumber: 'DEMO-LOT1', status: 'RELEASED' }];
      else if (path === '/laboratories/42/equipments') body = [{ id: 4, laboratoryId: 42, environmentId: 1, name: 'DEMO equipment', deviceType: null }];
      else if (/\/reports\/\d+\/content$/.test(path)) {
        const id = Number(path.split('/')[2]);
        await route.fulfill({ status: 200, contentType: 'application/pdf', body: contents[id] });
        return;
      } else if (request.method() === 'POST') {
        created.push({ path, body: request.postDataJSON() });
        status = reportStatus;
        if (status === 201) body = { id: path.includes('/batches/') ? 71 : path.includes('/equipments/') ? 73 : 72 };
        else body = { message: 'Unavailable record' };
      }
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    });
    const page = await context.newPage();
    const runtimeErrors = [];
    page.on('pageerror', (error) => runtimeErrors.push(error.message));
    await page.goto(origin + '/reports/new');
    await page.locator('app-report-params-form').waitFor();

    const generate = page.locator('app-report-params-form .actions button[mat-flat-button]');
    const chooseType = async (title) => {
      await page.locator('.type-card').filter({ hasText: title }).click();
    };
    const choose = async (label, option) => {
      await page.locator('app-report-params-form mat-form-field').filter({ hasText: label }).click();
      await page.getByRole('option', { name: option, exact: true }).click();
    };
    const downloadedBytes = async () => {
      const [file] = await Promise.all([page.waitForEvent('download'), generate.click()]);
      return readFile(await file.path());
    };
    const forms = english['report-generator'];

    // Batch report: nothing to generate until the batch is chosen.
    await chooseType(forms.batch.title);
    assert.equal(await generate.isDisabled(), true);
    await choose(forms['select-batch'], 'DEMO-LOT1');
    assert.deepEqual(await downloadedBytes(), contents[71]);

    // Environmental report of the last days.
    await chooseType(forms.compliance.title);
    await page.locator('.quick-chips .chip').first().click();
    assert.deepEqual(await downloadedBytes(), contents[72]);

    // Equipment log of the last days.
    await chooseType(forms.equipment.title);
    await choose(forms['select-equipment'], 'DEMO equipment');
    await page.locator('.quick-chips .chip').first().click();
    assert.deepEqual(await downloadedBytes(), contents[73]);
    assert.equal(created.length, 3);

    // An invalid period is explained in words, never with a translation key.
    await page.locator('input[matStartDate]').fill('1/1/2019');
    await page.locator('input[matEndDate]').fill('1/5/2019');
    await page.locator('input[matEndDate]').press('Tab');
    await page.locator('.period-error').getByText(english.common.dateMin).waitFor();
    assert.equal(await generate.isDisabled(), true);
    await page.locator('.quick-chips .chip').first().click();
    await page.locator('.period-error').waitFor({ state: 'detached' });

    // A report the platform refuses shows its message in the chosen language.
    if (width < 1440) {
      await page.getByRole('radio', { name: 'Español', exact: true }).click();
      await page.getByText(spanish['report-generator'].title).waitFor();
    }
    reportStatus = 403;
    await generate.click();
    await page.locator('app-error-banner').waitFor();
    assert.equal(created.length, 4);

    const overflow = await page.locator('mat-sidenav-content').evaluate((element) => element.scrollWidth - element.clientWidth);
    assert.ok(overflow <= 1, `The generator must not overflow at ${width}px, it overflows by ${overflow}px`);
    await page.locator('mat-sidenav-content').evaluate((element) => element.scrollTo(0, 0));
    await page.screenshot({ path: `${directory}/generator-${width}.png` });
    assert.deepEqual(runtimeErrors, []);
    await context.close();
    console.log(`PASS report generator ${width}px: three downloads, invalid period, refused report, no overflow`);
  }
} finally {
  await browser.close();
}
