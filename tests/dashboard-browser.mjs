import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile } from 'node:fs/promises';

const origin = process.env.WEB_URL ?? 'http://localhost:4200';
const directory = process.env.OUTPUT_DIR ?? 'test-results/dashboard';
const spanish = JSON.parse(await readFile('public/i18n/es.json', 'utf8'));
await mkdir(directory, { recursive: true });

const environments = [
  { id: 1, code: 'PROD-01', name: 'Production room', usage: 'PRODUCTION' },
  { id: 2, code: 'COLD-01', name: 'Cold chamber', usage: 'PRODUCT_STORAGE' },
];
const devices = [
  { id: 4, laboratoryId: 42, environmentId: 2, name: 'DEMO cold chamber', deviceType: 'CONTAINER_MONITOR' },
  { id: 5, laboratoryId: 42, environmentId: 1, name: 'DEMO production room', deviceType: 'ENVIRONMENTAL_DEVICE' },
];
const batches = ['IN_PROGRESS', 'RELEASED', 'PENDING', 'REJECTED'].map((status, index) => ({
  id: index + 5,
  environmentId: 1,
  productId: 3,
  productName: 'Paracetamol 500 mg',
  batchNumber: `DEMO-LOT${index + 1}`,
  status,
}));
const readingsOf = (deviceId, start) =>
  Array.from({ length: 20 }, (_, index) => [
    { deviceId, metric: 'TEMPERATURE', unit: '°C', value: start + Math.sin(index), measuredAt: new Date(Date.now() - (20 - index) * 3_600_000).toISOString() },
    { deviceId, metric: 'HUMIDITY', unit: '%', value: 55 + Math.sin(index), measuredAt: new Date(Date.now() - (20 - index) * 3_600_000).toISOString() },
  ]).flat();

const browser = await chromium.launch();
try {
  for (const width of [1440, 768, 375, 320]) {
    const context = await browser.newContext({ viewport: { width, height: 960 } });
    await context.addInitScript(() => {
      localStorage.setItem('token', 'test.' + btoa(JSON.stringify({ exp: Date.now() / 1000 + 3600 })) + '.test');
      localStorage.setItem('userId', '27');
      localStorage.setItem('username', 'Dashboard fixture');
      localStorage.setItem('roles', '["ROLE_QA_MANAGER"]');
    });
    let mode = 'ready';
    // Never send fixture credentials to the backend or modify a development account.
    await context.route('**/api/v1/**', async (route) => {
      const path = new URL(route.request().url()).pathname.replace(/^.*\/api\/v1/, '');
      let body = [];
      let status = 200;
      if (path === '/users/me/onboarding') body = { userId: 27, laboratoryId: 42, subscriptionId: 73, subscriptionStatus: 'ACTIVE', nextStep: 'READY' };
      else if (path === '/users/me/profile') body = { userId: 27, staffId: null, username: 'fixture', email: null, roles: [], fullName: 'Dashboard Fixture', dni: null, phoneNumber: null, location: null, position: null, hasPhoto: false };
      else if (path === '/users/me/notifications/unread-count') body = { unreadCount: 0 };
      else if (path === '/laboratories/42') body = { id: 42, name: 'Multilab', ownerId: 27 };
      else if (path === '/laboratories/42/environments') body = environments;
      else if (path === '/laboratories/42/equipments') body = mode === 'empty' ? [] : devices;
      else if (path === '/laboratories/42/batches') body = mode === 'empty' ? [] : batches;
      else if (path === '/laboratories/42/environments/1/raw-materials') body = mode === 'empty' ? [] : [{ id: 1, name: 'Demo material', stockStatus: 'LOW' }];
      else if (path.endsWith('/deviation-alerts')) {
        if (mode === 'error') status = 503;
        else if (mode !== 'empty' && path.includes('/environments/1/')) {
          body = [{ id: 9, equipmentId: 5, parameterName: 'TEMPERATURE', recordedValue: 9.3, unit: '°C', severity: 'CRITICAL', status: 'UNRESOLVED', timestamp: '2026-09-05T10:00:00Z' }];
        }
      } else if (path === '/laboratories/42/environments/1/telemetry-measurements') body = readingsOf(5, 20);
      else if (path === '/laboratories/42/environments/2/container-monitors/4/telemetry-measurements') body = readingsOf(4, 5);
      else if (path === '/laboratories/42/subscriptions') {
        body = mode === 'empty' ? [] : [{ id: 73, laboratoryId: 42, planCode: 'BASIC', billingCycle: 'MONTHLY', status: 'ACTIVE', currentPeriodEnd: '2026-12-05T06:59:19Z' }];
      } else if (path === '/subscription-plans') {
        body = [
          { id: 1, code: 'BASIC', name: 'Standard Lab', billingCycle: 'MONTHLY', amount: 199, currency: 'USD', maxUsers: 10, maxEquipment: 5, active: true },
          { id: 2, code: 'ENTERPRISE', name: 'Enterprise', billingCycle: 'YEARLY', amount: 4990, currency: 'USD', maxUsers: 50, maxEquipment: 50, active: true },
        ];
      }
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(origin + '/dashboard');
    await page.locator('canvas').waitFor();
    await page.getByText('Standard Lab', { exact: true }).waitFor();
    await page.waitForFunction(() => document.querySelector('.summary-item:last-child strong')?.textContent?.trim() === '1');

    const telemetry = page.getByTestId('telemetry');
    await telemetry.locator('mat-select').first().click();
    await page.getByRole('option', { name: 'DEMO production room' }).click();
    await page.waitForFunction(() => /^2\d/.test(document.querySelector('.latest-reading strong')?.textContent?.trim() ?? ''));
    await telemetry.locator('mat-select').last().click();
    await page.getByRole('option', { name: /\(%\)/ }).click();
    await page.waitForFunction(() => document.querySelector('.latest-reading strong')?.textContent?.includes('%'));
    await page.waitForTimeout(300);
    const coloredPixels = await page.locator('canvas').evaluate((canvas) => {
      const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      let colored = 0;
      for (let index = 0; index < pixels.length; index += 4) if (pixels[index + 3] > 100) colored++;
      return colored;
    });
    assert.ok(coloredPixels > 100, 'The telemetry series must be visibly drawn');

    await page.getByRole('radio', { name: 'Español', exact: true }).click();
    await page.getByRole('heading', { name: spanish.dashboard.overview.telemetry }).waitFor();
    const overflow = await page.locator('main.dashboard').evaluate((main) => {
      const box = main.getBoundingClientRect();
      return [...main.querySelectorAll('*')]
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width > 0 && (rect.right > box.right + 2 || rect.left < box.left - 2);
        })
        .map((element) => element.tagName + '.' + element.className);
    });
    assert.deepEqual(overflow, [], 'The dashboard must not overflow at ' + width);
    await page.screenshot({ path: `${directory}/dashboard-${width}.png` });

    mode = 'error';
    await page.locator('.page-header button').click();
    await page.getByTestId('alerts').getByText(spanish.dashboard.overview['load-error']).waitFor();
    assert.ok(await page.getByTestId('subscription').getByText('Standard Lab', { exact: true }).isVisible());

    mode = 'empty';
    await page.locator('.page-header button').click();
    await page.getByText(spanish.dashboard.overview['no-devices'], { exact: true }).waitFor();
    await page.getByTestId('subscription').getByText(spanish.dashboard.cards['no-subscription'], { exact: true }).waitFor();
    assert.equal(await page.locator('canvas').count(), 0);

    // Someone who already pays for a plan follows a website link with another one, signed in: the notice appears once.
    mode = 'ready';
    await page.goto(origin + '/iam/sign-up?plan=ENTERPRISE&billingCycle=YEARLY');
    await page.waitForURL('**/dashboard');
    const notice = page.getByRole('dialog');
    await notice.getByText(/Enterprise \(Yearly\).*Standard Lab \(Monthly\)/).waitFor();
    await notice.getByRole('button', { name: 'Not now' }).click();
    await notice.waitFor({ state: 'detached' });
    await page.reload();
    await page.getByText('Standard Lab', { exact: true }).waitFor();
    await page.waitForLoadState('networkidle');
    assert.equal(await page.getByRole('dialog').count(), 0, 'The notice must appear only once');

    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS dashboard ${width}px: telemetry selection, units, subscription, Spanish, partial error, empty state, no overflow, plan switch notice`);
  }
} finally {
  await browser.close();
}
