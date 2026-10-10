import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

// System test: real browser + real Angular app + real Spring Boot API (no route mocks).
// Start the backend first with the isolated system-test server of Qualitrack-Platform:
//   mvn spring-boot:test-run -Dspring-boot.run.main-class=com.iotech.qualitrack.systemtest.SystemTestServer
// and the web app with `npm start`.
const origin = process.env.WEB_URL ?? 'http://localhost:4200';
const api = process.env.API_URL ?? 'http://localhost:8080/api/v1';
const username = process.env.SYSTEM_USERNAME ?? 'system.qa.manager';
const password = process.env.SYSTEM_PASSWORD ?? 'SystemTest123!';
const output = 'test-results/system';
const results = [];

await mkdir(output, { recursive: true });
const browser = await chromium.launch();

async function scenario(name, run) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await run(page);
    assert.deepEqual(errors, [], `Runtime errors in "${name}"`);
    results.push(`PASS ${name}`);
  } catch (error) {
    await page.screenshot({ path: `${output}/failure-${name.replace(/\W+/g, '-')}.png`, fullPage: true });
    results.push(`FAIL ${name}: ${error.message}`);
    throw error;
  } finally {
    await context.close();
  }
}

async function signIn(page, user, secret) {
  await page.goto(origin + '/iam/sign-in');
  await page.locator('#username').fill(user);
  await page.locator('#password').fill(secret);
  await page.locator('button[type=submit]').click();
}

async function apiCall(page, method, path, body) {
  const token = await page.evaluate(() => localStorage.getItem('token'));
  const response = await fetch(api + path, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, body: await response.json().catch(() => null) };
}

try {
  await scenario('protected pages redirect anonymous visitors to sign in', async page => {
    for (const path of ['/dashboard', '/equipments/equipment-list', '/alerts/alert-dashboard']) {
      await page.goto(origin + path);
      await page.waitForURL('**/iam/sign-in**');
    }
  });

  await scenario('invalid credentials are rejected without a session', async page => {
    await signIn(page, username, 'WrongPassword123!');
    await page.waitForTimeout(1500);
    assert.match(new URL(page.url()).pathname, /\/iam\/sign-in$/);
    assert.equal(await page.evaluate(() => localStorage.getItem('token')), null);
  });

  await scenario('quality manager completes onboarding, registers equipment and resolves a deviation', async page => {
    // 1. Sign in through the UI and complete the laboratory onboarding step.
    await signIn(page, username, password);
    await page.waitForURL(url => /\/(laboratories\/create|dashboard)/.test(url.pathname), { timeout: 15000 });
    if (new URL(page.url()).pathname.endsWith('/laboratories/create')) {
      await page.locator('[formcontrolname=name]').fill('System Test Laboratory');
      await page.locator('[formcontrolname=ruc]').fill('20' + String(Date.now()).slice(-9));
      await page.locator('[formcontrolname=address]').fill('Av. Javier Prado 123, Lima');
      await page.locator('[formcontrolname=phone]').fill('999123456');
      await page.locator('mat-select[formcontrolname=applicableRegulations]').click();
      await page.getByRole('option', { name: 'BPM_DIGEMID' }).click();
      await page.keyboard.press('Escape');
      await page.locator('button[type=submit]').click();
      await page.waitForURL('**/dashboard', { timeout: 15000 });
    }
    await page.screenshot({ path: `${output}/01-dashboard.png`, fullPage: true });

    // 2. Register an equipment through the form and find it in the list.
    const serial = 'SYS-' + randomUUID().slice(0, 8).toUpperCase();
    await page.goto(origin + '/equipments/register-equipment');
    await page.locator('[formcontrolname=name]').fill('Cold storage system test');
    await page.locator('mat-select[formcontrolname=type]').click();
    await page.getByRole('option', { name: 'Refrigerator' }).click();
    await page.locator('[formcontrolname=model]').fill('R-200');
    await page.locator('[formcontrolname=serialNumber]').fill(serial);
    await page.locator('button[type=submit]').click();
    await page.waitForURL('**/equipments/equipment-detail/**', { timeout: 15000 });
    await page.goto(origin + '/equipments/equipment-list');
    await page.getByText('Cold storage system test').first().waitFor();
    await page.screenshot({ path: `${output}/02-equipment-list.png`, fullPage: true });

    // 3. The environment monitor reports a deviation directly to the API, as the IoT edge would.
    const onboarding = await apiCall(page, 'GET', '/users/me/onboarding');
    const laboratoryPath = `/laboratories/${onboarding.body.laboratoryId}`;
    const suffix = randomUUID().slice(0, 8).toUpperCase();
    const environment = await apiCall(page, 'POST', `${laboratoryPath}/environments`, {
      code: `ENV-${suffix}`, name: 'System test environment',
    });
    assert.equal(environment.status, 201);
    const environmentPath = `${laboratoryPath}/environments/${environment.body.id}`;
    const device = await apiCall(page, 'POST', `${laboratoryPath}/devices/environmental-devices`, {
      name: 'Space monitor', sensorExternalId: `ENV-${suffix}`, serialNumber: `MAC-${suffix}`,
      model: 'ESP32-WROOM-32', firmwareVersion: '1.0.3',
    });
    assert.equal(device.status, 201);
    const association = await apiCall(page, 'POST', `${environmentPath}/environmental-devices`, { deviceId: device.body.id });
    assert.equal(association.status, 201);
    const alert = await apiCall(page, 'POST', `${environmentPath}/deviation-alerts`, {
      parameterName: 'TEMPERATURE', recordedValue: 9.5, thresholdValue: 8.0, unit: 'Celsius',
      detectedAt: new Date().toISOString(), severity: 'CRITICAL',
    });
    assert.equal(alert.status, 201);

    // 4. Review the alert detail in the UI and resolve it with notes.
    await page.goto(origin + `/alerts/deviation-detail/${alert.body.id}`);
    await page.getByText('TEMPERATURE').first().waitFor();
    await page.getByText('9.5 Celsius').waitFor();
    await page.getByText('8 Celsius').waitFor();
    const resolve = page.getByRole('button', { name: /resolve/i });
    const notes = page.locator('[formcontrolname=resolutionNotes]');
    await resolve.click();
    await notes.waitFor();
    assert.equal((await apiCall(page, 'GET', `/deviation-alerts/${alert.body.id}`)).body.status, 'UNRESOLVED',
      'The alert must stay unresolved without notes');
    await notes.fill('Short');
    await resolve.click();
    await notes.waitFor();
    assert.equal((await apiCall(page, 'GET', `/deviation-alerts/${alert.body.id}`)).body.status, 'UNRESOLVED',
      'The alert must require at least ten characters of notes');
    await notes.fill('Door closed and equipment recalibrated');
    await page.screenshot({ path: `${output}/03-alert-detail.png`, fullPage: true });
    await resolve.click();
    await page.locator('[formcontrolname=resolutionNotes]').waitFor({ state: 'detached', timeout: 15000 });
    await page.screenshot({ path: `${output}/04-alert-resolved.png`, fullPage: true });

    // 5. The resolution is persisted by the backend.
    const stored = await apiCall(page, 'GET', `/deviation-alerts/${alert.body.id}`);
    assert.equal(stored.body.status, 'RESOLVED');
    assert.equal(stored.body.resolutionNotes, 'Door closed and equipment recalibrated');
    assert.equal(stored.body.resolvedBy, Number(await page.evaluate(() => localStorage.getItem('userId'))));
  });
} finally {
  await browser.close();
  console.log(results.join('\n'));
}
