import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const origin = process.env.WEB_URL ?? 'http://localhost:4200';
await mkdir('test-results/inventory', { recursive: true });
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
    let stock = 100, posts = 0, stale = false, unavailable = false;
    const history = [];
    const material = () => ({ id: 2, laboratoryId: 42, name: 'Sodium chloride', code: 'RM-001',
      supplier: 'IoTech test supplier', batchNumber: 'SUP-001', expirationDate: '2028-01-01',
      currentStock: stock, minimumThreshold: 20, unit: 'kg' });
    const batch = { id: 7, labId: 42, productId: 3, productName: 'Test pharmaceutical product',
      batchNumber: 'LOT-2026-001', quantity: 10, unit: 'units', status: 'IN_PROGRESS', startDate: '2026-09-08' };
    // All API requests are intercepted. No fixture credentials reach the development backend.
    await context.route('**/api/v1/**', async route => {
      const url = new URL(route.request().url()), path = url.pathname;
      let body = [], status = 200;
      if (path.endsWith('/users/me/onboarding')) body = { userId: 27, laboratoryId: 42, subscriptionId: 73, subscriptionStatus: 'ACTIVE', nextStep: 'READY' };
      else if (path.endsWith('/laboratories/42/raw-materials')) body = url.searchParams.get('lowStock') === 'true' && stock > 20 ? [] : [material()];
      else if (path.endsWith('/raw-materials/2/usages')) { body = [...history].reverse(); if (unavailable) status = 503; }
      else if (path.endsWith('/batches/7/raw-materials')) {
        if (route.request().method() === 'POST') {
          posts++;
          const request = route.request().postDataJSON();
          assert.equal(request.unit, 'kg');
          assert.equal(request.rawMaterialId, 2);
          if (stale) { stock = 40; stale = false; }
          if (request.quantityUsed > stock) { status = 409; body = { code: 'RAWMATERIALSTOCK_CONFLICT', details: 'Insufficient stock' }; }
          else {
            const before = stock; stock -= request.quantityUsed;
            body = { id: posts, batchId: 7, rawMaterialId: 2, rawMaterialName: 'Sodium chloride',
              quantityUsed: request.quantityUsed, unit: 'kg', usageDate: '2026-09-08T07:20:00Z', stockBefore: before, stockAfter: stock };
            history.push(body); status = 201;
          }
        } else body = history;
      } else if (path.endsWith('/batches/7')) body = batch;
      else if (path.endsWith('/batches')) body = [batch];
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + '/batches/batch-detail/7');
    await page.getByRole('tab', { name: 'Raw Materials Used' }).click();
    const usage = page.locator('app-raw-material-usage');
    const select = usage.locator('mat-select');
    const quantity = usage.getByRole('spinbutton');
    const add = usage.getByRole('button', { name: 'Add Material' });
    if (width === 320) await page.screenshot({ path: 'test-results/inventory/form-320.png', fullPage: true, animations: 'disabled' });
    await select.click();
    await page.getByRole('option', { name: /Sodium chloride/ }).click();
    await quantity.fill('200');
    await quantity.blur();
    await usage.getByText('Insufficient stock. Available: 100 kg.').waitFor();
    assert.equal(await add.isDisabled(), true);
    assert.equal(posts, 0);
    await page.screenshot({ path: `test-results/inventory/insufficient-${width}.png`, fullPage: true, animations: 'disabled' });
    await quantity.fill('50');
    await add.click();
    await usage.getByText('Consumption recorded and stock updated.').waitFor();
    assert.equal(stock, 50);
    assert.equal(posts, 1);
    await usage.getByRole('link', { name: 'Sodium chloride' }).click();
    await page.getByRole('heading', { name: 'Sodium chloride', exact: true }).waitFor();
    assert.match(await page.locator('.stock-total strong').innerText(), /50 kg/);
    assert.match(await page.locator('tbody tr').innerText(), /100 kg[\s\S]*50 kg/);
    await page.getByRole('link', { name: 'Back to inventory' }).click();
    const row = page.getByRole('row').filter({ has: page.getByRole('link', { name: 'Sodium chloride' }) });
    assert.match(await row.innerText(), /50 kg/);
    await page.getByRole('link', { name: 'Sodium chloride' }).click();
    await page.getByRole('link', { name: 'LOT-2026-001' }).click();
    await page.getByRole('tab', { name: 'Raw Materials Used' }).click();
    await select.click();
    await page.getByRole('option', { name: /Sodium chloride/ }).click();
    await quantity.fill('50');
    stale = true;
    await add.click();
    await usage.getByText('Insufficient stock. Inventory has changed; check the updated available quantity.').waitFor();
    assert.equal(await quantity.inputValue(), '50', 'Failed submission must retain values');
    await usage.getByText('Insufficient stock. Available: 40 kg.', { exact: true }).waitFor();
    assert.equal(history.length, 1);
    await quantity.fill('25'); await add.click();
    await usage.getByText('Consumption recorded and stock updated.').waitFor();
    assert.equal(stock, 15);
    history.unshift({ id: 0, batchId: 7, rawMaterialId: 2, rawMaterialName: 'Sodium chloride',
      quantityUsed: 200, unit: 'kg', usageDate: '2026-09-01', stockBefore: null, stockAfter: null });
    await page.goto(origin + '/laboratories/raw-materials/2');
    await page.getByRole('heading', { name: 'Sodium chloride', exact: true }).waitFor();
    await page.getByRole('radio', { name: 'Español', exact: true }).click();
    await page.getByText('Stock disponible', { exact: true }).waitFor();
    assert.equal(await page.locator('tbody tr').count(), 3);
    assert.equal(await page.getByText('No registrado', { exact: true }).count(), 2);
    const overflow = await page.locator('.material-detail').evaluate(main => {
      const box = main.getBoundingClientRect();
      return [...main.querySelectorAll('*')].filter(element => {
        const r = element.getBoundingClientRect();
        return r.width > 0 && (r.right > box.right + 2 || r.left < box.left - 2);
      }).map(element => element.tagName);
    });
    assert.deepEqual(overflow, [], 'History must fit ' + width + 'px');
    await page.screenshot({ path: `test-results/inventory/history-${width}.png`, fullPage: true, animations: 'disabled' });
    unavailable = true;
    await page.getByRole('button', { name: 'Actualizar', exact: true }).click();
    await page.getByText('No se pudo cargar el stock y el historial de consumo.').waitFor();
    unavailable = false; history.length = 0;
    await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
    await page.getByText('No se han registrado consumos de esta materia prima.').waitFor();
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS inventory ${width}px: insufficient stock, units, deduction, retry conflict, history, legacy, ES, error, empty`);
  }
} finally { await browser.close(); }
