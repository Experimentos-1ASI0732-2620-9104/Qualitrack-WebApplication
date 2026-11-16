import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';

const origin = process.env.WEB_URL ?? 'http://localhost:4200';
const directory = process.env.OUTPUT_DIR ?? 'test-results/inventory';
const english = JSON.parse(await readFile('public/i18n/en.json', 'utf8'));
const texts = english.inventory;
/** The button that registers a material, named like every register button of the application. */
const register = english.common.register;
await mkdir(directory, { recursive: true });

const environment = { id: 1, code: 'ALM-01', name: 'Raw material warehouse', usage: 'RAW_MATERIAL_STORAGE' };
const materialsPath = '/laboratories/42/environments/1/raw-materials';

const browser = await chromium.launch();
try {
  for (const width of process.argv[2] ? [Number(process.argv[2])] : [1440, 768, 375, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 960 } });
    await context.addInitScript(() => {
      localStorage.setItem('token', 'test.' + btoa(JSON.stringify({ exp: Date.now() / 1000 + 3600 })) + '.test');
      localStorage.setItem('userId', '27');
      localStorage.setItem('username', 'Inventory fixture');
      localStorage.setItem('roles', '["ROLE_QA_MANAGER"]');
    });
    let material = null;
    let receipt = null;
    let rejectRegistration = true;
    const movements = [];
    const addMovement = (type, amount, before, reason) => {
      movements.unshift({
        id: movements.length + 1, materialId: 2, receiptId: 11, productBatchId: null, type, amount, unit: 'kg',
        stockBefore: before, stockAfter: receipt.availableAmount, statusBefore: null, statusAfter: receipt.status,
        reason, actorId: 27, occurredAt: '2026-09-13T15:00:00Z',
      });
    };
    await context.route('**/api/v1/**', async (route) => {
      const request = route.request();
      const method = request.method();
      const path = new URL(request.url()).pathname.replace(/^.*\/api\/v1/, '');
      const data = method === 'GET' ? null : request.postDataJSON();
      let body = [];
      let status = 200;
      const released = receipt?.status === 'RELEASED';
      if (path === '/users/me/onboarding') body = { userId: 27, laboratoryId: 42, subscriptionId: 73, subscriptionStatus: 'ACTIVE', nextStep: 'READY' };
      else if (path === '/users/me/profile') body = { userId: 27, staffId: null, username: 'fixture', email: null, roles: [], fullName: 'Inventory Fixture', dni: null, phoneNumber: null, location: null, position: null, hasPhoto: false };
      else if (path === '/users/me/notifications/unread-count') body = { unreadCount: 0 };
      else if (path === '/laboratories/42') body = { id: 42, name: 'Multilab', ownerId: 27 };
      else if (path === '/laboratories/42/environments') body = [environment];
      else if (path === materialsPath) {
        if (method === 'POST') {
          if (rejectRegistration) {
            rejectRegistration = false;
            status = 409;
            body = { details: 'Material code already exists' };
          } else {
            material = { ...data, id: 2, laboratoryId: 42, environmentId: 1, usableStock: 0, physicalStock: 0, stockStatus: 'OUT', legacyId: null };
            status = 201;
            body = material;
          }
        } else body = material ? [{ ...material, usableStock: released ? receipt.availableAmount : 0, physicalStock: receipt?.availableAmount ?? 0 }] : [];
      } else if (path === `${materialsPath}/2`) {
        body = { ...material, usableStock: released ? receipt.availableAmount : 0, physicalStock: receipt?.availableAmount ?? 0 };
      } else if (path === `${materialsPath}/2/batches`) {
        if (method === 'POST') {
          receipt = {
            ...data, id: 11, laboratoryId: 42, rawMaterialId: 2, unit: 'kg', initialAmount: data.amount ?? data.initialAmount,
            availableAmount: data.amount ?? data.initialAmount, status: 'QUARANTINED', usable: false, expirationStatus: 'VALID',
          };
          addMovement('RECEIPT', receipt.availableAmount, 0, 'Received');
          status = 201;
          body = receipt;
        } else body = receipt ? [receipt] : [];
      } else if (path === `${materialsPath}/2/batches/11/reviews` && method === 'POST') {
        const previousStatus = receipt.status;
        receipt = { ...receipt, status: data.status, usable: data.status === 'RELEASED' };
        addMovement('REVIEW', 0, receipt.availableAmount, data.reason);
        status = 201;
        body = {
          id: 21, rawMaterialBatchId: 11, rawMaterialId: 2, previousStatus, status: data.status, reason: data.reason,
          reviewedBy: 27, reviewedAt: '2026-09-13T16:00:00Z',
        };
      } else if (path === `${materialsPath}/2/movements`) body = movements;
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));

    // The inventory opens the catalogue of the only environment.
    await page.goto(origin + '/inventory');
    await page.waitForURL('**/inventory/environments/1/raw-materials');
    await page.getByRole('heading', { name: texts.title }).waitFor();

    // A material is registered in its own page, which does not show the catalogue.
    await page.getByRole('link', { name: texts.newMaterial, exact: true }).click();
    await page.waitForURL('**/inventory/environments/1/raw-materials/new');
    const registration = page.locator('app-register-material');
    await registration.getByLabel(texts.code).waitFor();
    assert.equal(await page.locator('app-inventory-catalogue').count(), 0);
    await page.screenshot({ path: `${directory}/register-${width}.png` });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);

    // The required fields are asked for, and a refusal of the platform keeps what was written.
    await registration.getByRole('button', { name: register, exact: true }).click();
    await registration.getByText(texts.required, { exact: true }).first().waitFor();
    assert.equal(material, null);
    await registration.getByLabel(texts.code).fill('RM-001');
    await registration.getByLabel(texts.name).fill('Sodium chloride');
    await registration.getByLabel(texts.minimum).fill('20');
    await registration.getByRole('button', { name: register, exact: true }).click();
    await page.getByRole('alert').filter({ hasText: 'Material code already exists' }).waitFor();
    assert.equal(await registration.getByLabel(texts.code).inputValue(), 'RM-001');
    await registration.getByRole('button', { name: register, exact: true }).click();
    await page.waitForURL('**/inventory/environments/1/raw-materials');

    // Its detail opens from the catalogue.
    await page.getByRole('link', { name: 'Sodium chloride', exact: true }).click();
    await page.waitForURL('**/inventory/environments/1/raw-materials/2');
    await page.getByRole('heading', { name: /Sodium chloride/ }).waitFor();

    // A receipt waits in quarantine until a quality manager reviews it.
    await page.getByRole('button', { name: texts.newReceipt, exact: true }).click();
    await page.locator('[formcontrolname=supplier]').fill('IoTech test supplier');
    await page.locator('[formcontrolname=batchNumber]').fill('SUP-001');
    await page.locator('[formcontrolname=amount]').fill('100');
    await page.locator('[formcontrolname=receivedOn]').fill('2026-09-13');
    await page.locator('[formcontrolname=expiresOn]').fill('2028-01-01');
    await page.locator('.editor .actions button[mat-flat-button]').click();
    await page.locator('.status', { hasText: texts.status.QUARANTINED }).first().waitFor();
    assert.equal(receipt.availableAmount, 100);
    await page.getByRole('button', { name: texts.review, exact: true }).click();
    await page.locator('.review mat-form-field').first().click();
    await page.getByRole('option', { name: texts.status.RELEASED, exact: true }).click();
    await page.locator('[formcontrolname=reason]').fill('Certificate verified and received quantity checked');
    await page.getByRole('button', { name: texts.confirmReview, exact: true }).click();
    await page.locator('.status', { hasText: texts.status.RELEASED }).first().waitFor();
    assert.equal(receipt.status, 'RELEASED');
    await page.screenshot({ path: `${directory}/receipts-${width}.png` });

    // What happened is in its movements.
    await page.getByRole('tab', { name: texts.movements, exact: true }).click();
    await page.getByText(texts.types.RECEIPT, { exact: true }).first().waitFor();
    assert.deepEqual(errors, []);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `No horizontal overflow at ${width}px`);
    await page.screenshot({ path: `${directory}/detail-${width}.png` });
    await context.close();
    console.log(`PASS inventory ${width}px: catalogue, registration, validation, refused code, receipt review and movements`);
  }
} finally {
  await browser.close();
}
