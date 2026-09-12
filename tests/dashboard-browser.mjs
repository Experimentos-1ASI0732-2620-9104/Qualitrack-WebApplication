import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const origin = process.env.WEB_URL ?? 'http://localhost:4200';
await mkdir('test-results/dashboard', { recursive: true });
const browser = await chromium.launch();
try {
  for (const width of [1440, 768, 375, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 960 } });
    await context.addInitScript(() => {
      localStorage.setItem('token', 'test.' + btoa(JSON.stringify({ exp: Date.now() / 1000 + 3600 })) + '.test');
      localStorage.setItem('userId', '27'); localStorage.setItem('username', 'Dashboard fixture');
      localStorage.setItem('roles', '["ROLE_QA_MANAGER"]');
    });
    let mode = 'ready';
    const requestedEquipment = new Set();
    // Never send fixture credentials to the backend or modify a development account.
    await context.route('**/api/v1/**', async route => {
      const url = new URL(route.request().url());
      const path = url.pathname;
      let body = [], status = 200;
      if (path.endsWith('/users/me/onboarding')) body = { userId: 27, laboratoryId: 42, subscriptionId: 73, subscriptionStatus: 'ACTIVE', nextStep: 'READY' };
      else if (path.endsWith('/laboratories/42')) body = { id: 42, name: 'Multilab', ownerId: 27 };
      else if (path.endsWith('/equipments')) {
        assert.equal(url.searchParams.get('labId'), '42');
        body = mode === 'empty' ? [] : [4, 5, 6].map(id => ({ id, laboratoryId: 42,
          name: id === 4 ? 'DEMO cold chamber' : id === 5 ? 'DEMO production room' : 'DEMO warehouse', status: 'OPERATIONAL' }));
      } else if (path.endsWith('/batches')) {
        assert.equal(url.searchParams.get('labId'), '42');
        body = mode === 'empty' ? [] : ['IN_PROGRESS', 'RELEASED', 'PENDING', 'REJECTED'].map((state, i) => ({ id: i + 5, labId: 42,
          batchNumber: `DEMO-LOT${i + 1}`, productName: 'Paracetamol 500 mg', status: state, createdAt: '2026-09-05T10:00:00Z' }));
      } else if (path.endsWith('/raw-materials')) body = mode === 'empty' ? [] : [{ id: 1, laboratoryId: 42, name: 'Demo material', currentStock: 4, minimumThreshold: 5 }];
      else if (path.endsWith('/deviation-alerts')) {
        if (mode === 'error') status = 503;
        const id = Number(path.split('/')[4]);
        requestedEquipment.add(id);
        body = [{ id, equipmentId: id, parameterName: 'Temperature', recordedValue: 9.3, thresholdValue: 8, unit: 'C',
          severity: id === 4 ? 'CRITICAL' : 'WARNING', status: id === 4 ? 'UNRESOLVED' : id === 5 ? 'ACKNOWLEDGED' : 'RESOLVED', timestamp: '2026-09-05T10:00:00Z' }];
      } else if (path.endsWith('/telemetry-measurements')) {
        const equipmentId = Number(path.split('/')[4]);
        body = mode === 'empty' ? [] : Array.from({ length: 20 }, (_, i) => ['Temperature', 'Humidity'].map(parameterName => ({
          id: i * 2 + (parameterName === 'Temperature' ? 0 : 1), equipmentId, parameterName, unit: parameterName === 'Temperature' ? 'C' : '%',
          value: (parameterName === 'Temperature' ? equipmentId === 4 ? 5 : 20 : 55) + Math.sin(i),
          timestamp: new Date(Date.UTC(2026, 8, 5, i)).toISOString(), createdAt: '2026-09-05T12:00:00Z',
        }))).flat();
      } else if (path.endsWith('/subscriptions')) body = mode === 'empty' ? [] : [{ id: 73, userId: 27, laboratoryId: 42,
        planCode: 'BASIC', billingCycle: 'MONTHLY', status: 'ACTIVE', currentPeriodEnd: '2026-10-05T06:59:19Z' }];
      else if (path.endsWith('/subscription-plans')) body = [{ id: 1, code: 'BASIC', name: 'Standard Lab', billingCycle: 'MONTHLY',
        amount: 199, currency: 'USD', maxUsers: 10, maxEquipment: 5, active: true }];
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + '/dashboard');
    await page.locator('canvas').waitFor();
    await page.getByText('Standard Lab', { exact: true }).waitFor();
    assert.equal(await page.locator('.summary-item').last().locator('strong').innerText(), '1');
    assert.deepEqual([...requestedEquipment].sort(), [4, 5, 6]);
    const telemetry = page.getByTestId('telemetry');
    await telemetry.locator('mat-select').first().click();
    await page.getByRole('option', { name: 'DEMO production room' }).click();
    await page.waitForFunction(() => document.querySelector('.latest-reading strong')?.textContent?.includes('20.'));
    await telemetry.locator('mat-select').last().click();
    await page.getByRole('option', { name: 'Humidity (%)' }).click();
    await page.waitForFunction(() => document.querySelector('.latest-reading strong')?.textContent?.includes('%'));
    const canvasPixels = await page.locator('canvas').evaluate(canvas => {
      const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      let colored = 0;
      for (let i = 0; i < pixels.length; i += 4) if (pixels[i + 3] > 100 && pixels[i + 1] > pixels[i] * 1.5) colored++;
      return colored;
    });
    assert.ok(canvasPixels > 100, 'Telemetry series must be visibly drawn');
    await page.getByRole('radio', { name: 'Español', exact: true }).click();
    await page.getByRole('heading', { name: /Telemetría de equipos/ }).waitFor();
    const overflow = await page.locator('main.dashboard').evaluate(main => {
      const box = main.getBoundingClientRect();
      return [...main.querySelectorAll('*')].filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && (rect.right > box.right + 2 || rect.left < box.left - 2);
      }).map(el => el.tagName + '.' + el.className);
    });
    assert.deepEqual(overflow, [], 'Dashboard must not overflow at ' + width);
    await page.locator('mat-sidenav-content').evaluate(el => el.scrollTo(0, 0));
    await page.screenshot({ path: `test-results/dashboard/dashboard-${width}.png`, fullPage: true });
    if (width === 320) {
      await page.getByTestId('subscription').screenshot({ path: 'test-results/dashboard/subscription-320.png' });
      await page.getByTestId('alerts').screenshot({ path: 'test-results/dashboard/alerts-320.png' });
    }
    mode = 'error';
    await page.locator('.page-header button').click();
    await page.getByTestId('alerts').getByText('No se pudo cargar esta sección.').waitFor();
    assert.ok(await page.getByTestId('subscription').getByText('Standard Lab', { exact: true }).isVisible());
    assert.equal(await page.locator('canvas').count(), 1);
    mode = 'empty';
    await page.locator('.page-header button').click();
    await page.getByText('No hay equipos registrados.', { exact: true }).waitFor();
    await page.getByTestId('subscription').getByText('Sin plan activo', { exact: true }).waitFor();
    assert.equal(await page.locator('canvas').count(), 0);
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS dashboard ${width}px: telemetry selection, real units, subscription, ES, partial error, empty state, no overflow`);
  }
} finally { await browser.close(); }
