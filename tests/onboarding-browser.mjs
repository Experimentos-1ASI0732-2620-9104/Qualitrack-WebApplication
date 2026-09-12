import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

const origin = process.env.WEB_URL ?? 'http://localhost:4200';
const browser = await chromium.launch();
const results = [];
await mkdir('test-results/onboarding', { recursive: true });
try {
  // Real HTTP to the explicitly isolated local backend, not the mocked payment scenario below.
  const live = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await live.newPage();
  const username = 'local-browser-test-' + randomUUID();
  await page.goto(origin + '/iam/sign-up?role=qa-manager');
  await page.locator('#username').fill(username);
  await page.locator('#password').fill('TestPassword123!');
  await page.locator('#confirmPassword').fill('TestPassword123!');
  await page.locator('button[type=submit]').click();
  await page.waitForURL('**/iam/sign-in');
  assert.equal(await page.evaluate(() => localStorage.getItem('token')), null);
  await page.locator('#username').fill(username);
  await page.locator('#password').fill('TestPassword123!');
  await page.locator('button[type=submit]').click();
  await page.waitForURL('**/subscriptions/plans');
  await page.getByText('No subscription plans are available yet.').waitFor();
  await page.goto(origin + '/dashboard');
  await page.waitForURL('**/subscriptions/plans');
  await page.screenshot({ path: 'test-results/onboarding/real-account-without-subscription.png' });
  results.push('Real local HTTP: registration -> sign in -> plans; manual dashboard access denied');
  await live.close();

  // The provider boundary is mocked only in this test. It never activates a runtime subscription.
  let state = { userId: 27, laboratoryId: null, subscriptionId: null, subscriptionStatus: null, nextStep: 'SUBSCRIPTION' };
  const fixture = await browser.newContext({ viewport: { width: 320, height: 900 } });
  await fixture.addInitScript(() => {
    localStorage.setItem('token', 'test.' + btoa(JSON.stringify({ exp: Date.now() / 1000 + 3600 })) + '.test');
    localStorage.setItem('userId', '27'); localStorage.setItem('username', 'Browser fixture');
    localStorage.setItem('roles', '["ROLE_QA_MANAGER"]');
  });
  const laboratory = { id: 42, name: 'Browser fixture laboratory', ruc: '20123456789', address: 'Test address',
    phone: '999123456', applicableRegulations: ['BPM_DIGEMID'], createdAt: '2026-09-01T00:00:00Z' };
  await fixture.route('**/api/v1/**', async route => {
    const path = new URL(route.request().url()).pathname;
    let body = [], status = 200;
    if (path.endsWith('/users/me/onboarding')) body = state;
    else if (path.endsWith('/laboratories') && route.request().method() === 'POST') {
      state = { ...state, laboratoryId: 42, nextStep: 'READY' }; body = laboratory; status = 201;
    } else if (path === '/api/v1/laboratories/42') body = laboratory;
    else if (path.endsWith('/kpi-dashboards')) body = { id: null, laboratoryId: 42, metrics: [], overallHealthScore: null, timestamp: '2026-09-01' };
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  });
  const app = await fixture.newPage();
  await app.goto(origin + '/subscriptions/success?success=true');
  await app.waitForURL('**/subscriptions/success?success=true');
  await app.waitForTimeout(2300);
  assert.equal(new URL(app.url()).pathname, '/subscriptions/success');
  state = { ...state, subscriptionId: 73, subscriptionStatus: 'ACTIVE', nextStep: 'LABORATORY' };
  await app.waitForURL('**/laboratories/create', { timeout: 10000 });
  await app.locator('[formcontrolname=name]').fill('Browser fixture laboratory');
  await app.locator('[formcontrolname=ruc]').fill('20123456789');
  await app.locator('[formcontrolname=address]').fill('Test address');
  await app.locator('[formcontrolname=phone]').fill('999123456');
  await app.locator('mat-select').click();
  await app.getByRole('option', { name: 'BPM_DIGEMID', exact: true }).click();
  await app.keyboard.press('Escape');
  await app.locator('button[type=submit]').click();
  await app.waitForURL('**/dashboard');
  await app.getByRole('heading', { name: laboratory.name }).waitFor();
  assert.equal(await app.evaluate(() => localStorage.getItem('laboratoryId')), '42');
  assert.equal(await app.locator('mat-sidenav-content').evaluate(element => getComputedStyle(element).marginLeft), '0px');
  const menu = app.locator('button[aria-expanded]');
  await menu.click();
  await app.locator('mat-sidenav.mat-drawer-opened').waitFor();
  await app.waitForFunction(() => document.querySelector('mat-sidenav')?.contains(document.activeElement));
  await app.keyboard.press('Escape');
  await app.waitForFunction(() => document.querySelector('button[aria-expanded]')?.getAttribute('aria-expanded') === 'false');
  assert.equal(await menu.getAttribute('aria-expanded'), 'false');
  await app.getByRole('radio', { name: 'Español', exact: true }).click();
  await app.waitForFunction(() => document.documentElement.lang === 'es-419');
  await app.getByRole('button', { name: 'Actualizar', exact: true }).waitFor();
  await app.getByRole('radio', { name: 'Español', exact: true, checked: true }).waitFor();
  await app.getByRole('radio', { name: 'English', exact: true, checked: false }).waitFor();
  await app.waitForTimeout(300);
  await app.screenshot({ path: 'test-results/onboarding/verified-laboratory-mobile-spanish.png' });
  await app.reload();
  await app.waitForURL('**/dashboard');
  results.push('Isolated browser boundary: unverified payment stays pending, ACTIVE -> create lab -> dashboard, reload remains onboarded');
  results.push('320px: drawer opens and closes with Escape, no reserved margin; Spanish switch works');
  await fixture.close();
} finally {
  await browser.close();
  await writeFile('test-results/onboarding/results.json', JSON.stringify(results, null, 2));
}
console.log(results.join('\n'));
