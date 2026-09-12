import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';

const origin = process.env.WEB_URL ?? 'http://localhost:4200';
const pdfPath = process.env.REPORT_PDF_FIXTURE ?? '../qualitrack-platform/target/report-tests/batch-no-alerts.pdf';
const pdf = await readFile(pdfPath);
const compliancePdf = await readFile('../qualitrack-platform/target/report-tests/compliance-report.pdf');
const equipmentPdf = await readFile('../qualitrack-platform/target/report-tests/equipment-report.pdf');
const browser = await chromium.launch();
await mkdir('test-results/report-tests', { recursive: true });
try {
  for (const width of [1440, 375, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 960 }, acceptDownloads: true });
    await context.addInitScript(() => {
      localStorage.setItem('token', 'test.' + btoa(JSON.stringify({ exp: Date.now() / 1000 + 3600 })) + '.test');
      localStorage.setItem('userId', '27');
      localStorage.setItem('username', 'Report fixture');
      localStorage.setItem('roles', '["ROLE_QA_MANAGER"]');
    });
    let listMode = 'records';
    let downloadStatus = 200;
    const reportRequests = [];
    const periodRequests = [];
    // All API traffic is isolated. No test token or fixture record reaches the running backend.
    await context.route('**/api/v1/**', async route => {
      const url = new URL(route.request().url());
      const path = url.pathname;
      let body = [], status = 200;
      if (path.endsWith('/users/me/onboarding')) {
        body = { userId: 27, laboratoryId: 42, subscriptionId: 73, subscriptionStatus: 'ACTIVE', nextStep: 'READY' };
      } else if (path.endsWith('/batches') || path.endsWith('/equipments')) {
        assert.equal(url.searchParams.get('labId'), '42');
        if (listMode === 'error') status = 503;
        else if (listMode === 'records') {
          body = path.endsWith('/batches')
            ? [5, 6, 7, 8].map(id => ({ id, labId: 42, batchNumber: `DEMO-BILLY1-LOT${id - 4}`, productName: 'Demo product', status: 'RELEASED', quantity: 1000, unit: 'units', startDate: '2026-09-01' }))
            : [{ id: 4, laboratoryId: 42, name: 'DEMO equipment', status: 'OPERATIONAL', type: 'Refrigerator',
              model: 'DEMO-RX100', serialNumber: 'DEMO-4', sensorExternalId: null }];
        }
      } else if (path.endsWith('/batches/5/reports')) {
        reportRequests.push(route.request().postDataJSON());
        await route.fulfill({ status: downloadStatus, contentType: downloadStatus === 200 ? 'application/pdf' : 'application/json',
          body: downloadStatus === 200 ? pdf : JSON.stringify({ message: 'Unavailable record' }) });
        return;
      } else if (path.endsWith('/laboratories/42/compliance-reports') || path.endsWith('/equipments/4/log-reports')) {
        periodRequests.push({ path, body: route.request().postDataJSON() });
        await route.fulfill({ status: 200, contentType: 'application/pdf',
          body: path.includes('/compliance-reports') ? compliancePdf : equipmentPdf });
        return;
      }
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    });
    const page = await context.newPage();
    const runtimeErrors = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));
    await page.goto(origin + '/reports/report-generator');
    const batch = page.getByTestId('batch-select');
    const download = page.locator('mat-card').first().getByRole('button', { name: /Download|Descargar/ });
    await batch.waitFor();
    assert.equal(await download.isDisabled(), true);
    await batch.click();
    await page.getByRole('option', { name: 'DEMO-BILLY1-LOT1 (#5)', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('mat-card mat-card-actions button')?.disabled === false);
    assert.equal(await download.isEnabled(), true);
    const downloaded = page.waitForEvent('download');
    await download.click();
    const file = await downloaded;
    assert.deepEqual(await readFile(await file.path()), pdf);
    assert.equal(reportRequests[0].batchId, undefined);
    assert.equal(reportRequests[0].requestedBy, 27);
    assert.equal(reportRequests[0].includeTelemetry, false);
    const complianceCard = page.locator('mat-card').nth(1);
    const equipmentCard = page.locator('mat-card').nth(2);
    await page.getByTestId('equipment-select').click();
    await page.getByRole('option', { name: 'DEMO equipment (#4)', exact: true }).click();
    for (const [card, expected] of [[complianceCard, compliancePdf], [equipmentCard, equipmentPdf]]) {
      await card.locator('input[matStartDate]').fill('9/1/2026');
      await card.locator('input[matEndDate]').fill('9/5/2026');
      await card.locator('input[matEndDate]').press('Tab');
      assert.match(await card.locator('mat-select').last().innerText(), /PDF Document/);
      let document;
      try {
        [document] = await Promise.all([
          page.waitForEvent('download'),
          card.locator('mat-card-actions button').click(),
        ]);
      } catch (error) {
        await page.screenshot({ path: 'test-results/report-tests/period-download-failure.png', fullPage: true });
        console.error({ card: await card.innerText(), requests: periodRequests, runtimeErrors });
        throw error;
      }
      assert.deepEqual(await readFile(await document.path()), expected);
    }
    assert.equal(periodRequests.length, 2);
    for (const request of periodRequests) {
      assert.equal(request.body.format, 'PDF');
      assert.equal(request.body.startDate.slice(0, 10), '2026-09-01');
      assert.equal(request.body.endDate.slice(0, 10), '2026-09-05');
      assert.equal(request.body.requestedBy, 27);
    }
    if (width < 1440) {
      await page.getByRole('radio', { name: 'Español', exact: true }).click();
      await page.waitForFunction(() => document.documentElement.lang === 'es-419');
    }
    downloadStatus = 403;
    await download.click();
    await page.getByRole('alert').filter({ hasText: /not available to your account|no está disponible para tu cuenta/ }).waitFor();
    assert.equal(await page.locator('.generator-container').evaluate(el => el.scrollWidth <= el.clientWidth + 1), true);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.locator('mat-sidenav-content').evaluate(el => el.scrollTo(0, 0));
    await page.screenshot({ path: `test-results/report-tests/generator-${width}.png`, fullPage: true });
    listMode = 'empty';
    await page.reload();
    await batch.click();
    assert.equal(await page.getByRole('option').count(), 1);
    assert.equal(await page.getByRole('option').getAttribute('aria-disabled'), 'true');
    await page.keyboard.press('Escape');
    assert.equal(await download.isDisabled(), true);
    listMode = 'error';
    await page.reload();
    const retry = page.locator('mat-card').first().getByRole('button', { name: /Try again|Reintentar/ });
    await retry.waitFor();
    listMode = 'records';
    await retry.click();
    await batch.click();
    await page.getByRole('option', { name: 'DEMO-BILLY1-LOT1 (#5)', exact: true }).waitFor();
    await page.keyboard.press('Escape');
    assert.equal(runtimeErrors.length, 0, runtimeErrors.join('\n'));
    await context.close();
    console.log(`${width}px: all three PDF downloads, scoped selection, localized denial, empty list and retry passed`);
  }
} finally {
  await browser.close();
}
