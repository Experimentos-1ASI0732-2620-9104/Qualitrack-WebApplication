import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const origin = process.env.WEB_URL ?? 'http://127.0.0.1:4200';
const output = process.env.INVENTORY_ARTIFACTS ?? join(tmpdir(), 'qualitrack-inventory-verification');
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
 for (const width of process.argv[2] ? [Number(process.argv[2])] : [1440, 768, 375, 320]) {
  const context = await browser.newContext({ viewport: { width, height: 960 } });
  await context.addInitScript(() => {
   localStorage.setItem('token', 'test.' + btoa(JSON.stringify({ exp: Date.now() / 1000 + 3600 })) + '.test');
   localStorage.setItem('userId', '27'); localStorage.setItem('username', 'Inventory fixture');
   localStorage.setItem('roles', '["ROLE_QA_MANAGER"]');
  });
  let material = null, receipt = null, stale = false, posts = 0;
  const movements = [], usages = [];
  const batch = { id: 7, labId: 42, productId: 3, productName: 'Test product', batchNumber: 'LOT-007',
   quantity: 10, unit: 'units', status: 'IN_PROGRESS', startDate: '2026-09-08' };
  const addMovement = (type, amount, before, productBatchId = null, reason = '') => {
   const movement = { id: movements.length + 1, materialId: 2, receiptId: 11, productBatchId, type, amount,
    unit: 'kg', stockBefore: before, stockAfter: receipt.availableAmount, statusAfter: receipt.status,
    actorId: 27, occurredAt: '2026-09-13T15:00:00Z', reason };
   movements.unshift(movement);
  };
  await context.route('**/api/v1/**', async route => {
   const path = new URL(route.request().url()).pathname;
   const method = route.request().method(), data = method === 'GET' ? null : route.request().postDataJSON();
   let body = [], status = 200;
   if (path.endsWith('/users/me/onboarding')) body = { userId: 27, laboratoryId: 42, subscriptionId: 73, subscriptionStatus: 'ACTIVE', nextStep: 'READY' };
   else if (path.endsWith('/inventory/materials')) {
    if (method === 'POST') { material = { ...data, id: 2, laboratoryId: 42, legacyId: null }; status = 201; body = material; }
    else body = material ? [{ ...material, usableStock: receipt?.status === 'RELEASED' ? receipt.availableAmount : 0, physicalStock: receipt?.availableAmount ?? 0 }] : [];
   } else if (path.endsWith('/inventory/materials/2/receipts')) {
    if (method === 'POST') {
     receipt = { ...data, id: 11, rawMaterialId: 2, laboratoryId: 42, initialAmount: data.amount, availableAmount: data.amount, status: 'QUARANTINED' };
     addMovement('RECEIPT', data.amount, 0); status = 201; body = receipt;
    } else body = receipt ? [receipt] : [];
   } else if (path.endsWith('/inventory/receipts/11/reviews')) {
    assert.ok(data.reason.length); receipt.status = data.status; addMovement('REVIEW', 0, receipt.availableAmount, null, data.reason); body = receipt;
   } else if (path.endsWith('/inventory/materials/2/usable-receipts')) {
    body = receipt?.status === 'RELEASED' && receipt.availableAmount > 0 ? [receipt] : [];
   } else if (path.endsWith('/inventory/materials/2/movements')) body = movements;
   else if (path.endsWith('/inventory/consumptions')) {
    posts++; assert.equal(data.unit, 'kg'); assert.equal(data.receiptId, 11); assert.ok(data.operationId);
    if (stale) { receipt.availableAmount = 40; stale = false; }
    if (data.amount > receipt.availableAmount) { status = 409; body = { details: 'Insufficient stock in receipt' }; }
    else {
     const before = receipt.availableAmount; receipt.availableAmount -= data.amount; addMovement('CONSUMPTION', -data.amount, before, 7);
     usages.push({ id: posts, batchId: 7, rawMaterialId: 2, inventoryReceiptId: 11, rawMaterialName: material.name,
      quantityUsed: data.amount, unit: 'kg', usageDate: '2026-09-13T15:00:00Z', stockBefore: before, stockAfter: receipt.availableAmount });
     status = 201; body = { stockBefore: before, stockAfter: receipt.availableAmount };
    }
   } else if (path.endsWith('/batches/7/raw-materials')) body = usages;
   else if (path.endsWith('/batches/7')) body = batch;
   else if (path.endsWith('/batches')) body = [batch];
   await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin + '/inventory');
  await page.waitForURL('**/inventory/inventory-catalogue');
  await page.getByRole('button', { name: 'New material', exact: true }).click();
  await page.getByLabel('Code', { exact: true }).fill('RM-001');
  await page.getByLabel('Material', { exact: true }).fill('Sodium chloride');
  await page.getByLabel('Minimum stock', { exact: true }).fill('20');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByRole('link', { name: 'Sodium chloride', exact: true }).click();
  await page.waitForURL('**/inventory/inventory-detail/2');
  await page.goto(origin + '/inventory/materials/2');
  await page.waitForURL('**/inventory/inventory-detail/2');
  await page.getByRole('button', { name: 'New receipt', exact: true }).click();
  await page.getByLabel('Supplier', { exact: true }).fill('IoTech test supplier');
  await page.getByLabel('Supplier lot', { exact: true }).fill('SUP-001');
  await page.getByLabel('Received quantity', { exact: true }).fill('100');
  await page.getByLabel('Received on', { exact: true }).fill('2026-09-13');
  await page.getByLabel('Expires on', { exact: true }).fill('2028-01-01');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByText('Quarantined', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Review', exact: true }).click();
  await page.getByLabel('Review findings and reason').fill('Certificate verified and received quantity checked');
  await page.getByRole('button', { name: 'Confirm review', exact: true }).click();
  await page.getByText('Released', { exact: true }).waitFor();
  await page.screenshot({ path: join(output, `receipts-${width}.png`), fullPage: true, animations: 'disabled' });
  await page.goto(origin + '/batches/batch-detail/7');
  await page.getByRole('tab', { name: 'Raw Materials Used' }).click();
  const usage = page.locator('app-raw-material-usage');
  const quantity = usage.getByRole('spinbutton'), add = usage.getByRole('button', { name: 'Add Material' });
  const select = async () => {
   await usage.locator('mat-select').nth(0).click(); await page.getByRole('option', { name: /Sodium chloride/ }).click();
   await usage.locator('mat-select').nth(1).click(); await page.getByRole('option', { name: /SUP-001/ }).click();
  };
  await select(); await quantity.fill('200'); await quantity.blur();
  await usage.getByText('Insufficient stock. Available: 100 kg.').waitFor();
  assert.equal(await add.isDisabled(), true); assert.equal(posts, 0);
  await page.screenshot({ path: join(output, `overdraft-${width}.png`), fullPage: true, animations: 'disabled' });
  await quantity.fill('50'); await add.click(); await usage.getByText('Changes saved.', { exact: true }).waitFor();
  assert.equal(receipt.availableAmount, 50);
  await select(); await quantity.fill('50'); stale = true; await add.click();
  await usage.getByText('Insufficient stock in receipt', { exact: true }).waitFor();
  assert.equal(await quantity.inputValue(), '50'); assert.equal(usages.length, 1);
  await quantity.fill('25'); await add.click(); await usage.getByText('Changes saved.', { exact: true }).waitFor();
  assert.equal(receipt.availableAmount, 15);
  await usage.getByRole('link', { name: 'Sodium chloride', exact: true }).first().click();
  await page.waitForURL('**/inventory/inventory-detail/2');
  await page.getByRole('tab', { name: 'Movements', exact: true }).click();
  await page.getByText('Consumption', { exact: true }).first().waitFor();
  await page.screenshot({ path: join(output, `movements-${width}.png`), fullPage: true, animations: 'disabled' });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  assert.equal(overflow, false, `No horizontal overflow at ${width}px`);
  await page.getByRole('tab', { name: 'Receipts', exact: true }).click();
  await page.getByRole('button', { name: 'Review', exact: true }).click();
  await page.getByLabel('Review findings and reason').fill('Supplier reported a quality defect');
  await page.getByRole('button', { name: 'Confirm review', exact: true }).click();
  await page.getByRole('heading', { name: 'Product batches using observed or rejected receipts' }).waitFor();
  assert.equal(receipt.status, 'REJECTED');
  await page.getByRole('link', { name: 'Inventory', exact: true }).last().click();
  await page.getByRole('link', { name: 'Sodium chloride', exact: true }).waitFor();
  await page.screenshot({ path: join(output, `catalogue-${width}.png`), fullPage: true, animations: 'disabled' });
  assert.deepEqual(errors, []); await context.close();
  console.log(`PASS ${width}px: catalogue, receipt review, overdraft, consume, stale stock, movements and affected batches`);
 }
} finally { await browser.close(); }
