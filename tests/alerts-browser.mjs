import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { createServer } from 'node:http';

// Runs against `ng serve` or a development build: the scenarios about leaving the page answer the API themselves
// on localhost:8080, where the development configuration sends it. A production build would call the real platform.
const origin = process.env.WEB_URL ?? 'http://localhost:4200';
const directory = process.env.OUTPUT_DIR ?? 'test-results/alerts';
await mkdir(directory, { recursive: true });

const environments = [
  { id: 1, code: 'PROD-SOL-01', name: 'Área de producción de sólidos', usage: null },
  { id: 2, code: 'CAD-FRIO-01', name: 'Cámara de cadena de frío para medicamentos termolábiles', usage: null },
  { id: 3, code: 'ALM-MP-01', name: 'Almacén de materias primas', usage: null },
];
const devices = [
  { id: 11, name: 'Monitor ambiental PROD-SOL' },
  { id: 12, name: 'Refrigerador CF-01' },
  { id: 13, name: 'Monitor ambiental ALM-MP' },
];
const alertOf = (id, environmentId, equipmentId, changes) => ({
  id, laboratoryId: 42, environmentId, equipmentId, origin: 'ENVIRONMENT', parameterName: 'AIR_QUALITY',
  recordedValue: 951, thresholdValue: 900, unit: 'ppm', timestamp: '2026-10-04T22:01:00Z',
  severity: 'CRITICAL', status: 'UNRESOLVED', deviationCount: 1, ...changes,
});
const alerts = () => ({
  1: [alertOf(101, 1, 11)],
  2: [alertOf(102, 2, 12, { origin: 'CONTAINER', parameterName: 'TEMPERATURE', recordedValue: 12.5,
    thresholdValue: 8, unit: '°C', timestamp: '2026-10-04T19:04:00Z' })],
  3: [alertOf(103, 3, 13, { status: 'ACKNOWLEDGED', recordedValue: 935, deviationCount: 4,
    timestamp: '2026-10-03T14:00:00Z', acknowledgedBy: 12, acknowledgedAt: '2026-10-03T14:14:00Z',
    normalizedAt: '2026-10-05T05:15:00Z' }),
  alertOf(104, 3, 13, { severity: 'WARNING', parameterName: 'HUMIDITY', recordedValue: 71, thresholdValue: 65,
    unit: '%', timestamp: '2026-10-08T14:00:00Z' })],
});

const resolvedAlert = alertOf(105, 3, 13, { status: 'RESOLVED', timestamp: '2026-10-03T14:00:00Z', acknowledgedBy: 12, acknowledgedAt: '2026-10-03T14:14:00Z',
  resolvedBy: 27, resolvedAt: '2026-10-03T18:00:00Z', resolutionNotes: 'Se reemplazó el filtro HEPA del almacén.' });

const newPlatformState = () => ({ alerts: alerts(), failing: new Set(), acknowledgements: [], acknowledgeStatus: 200, resolutions: [] });

/** What the platform of the fixture answers to a request. */
function answerOf(state, method, path, requestBody) {
  let body = [];
  let status = 200;
  const environmentAlerts = path.match(/environments\/(\d+)\/deviation-alerts$/);
  const acknowledgement = path.match(/deviation-alerts\/(\d+)\/acknowledgements$/);
  const resolution = path.match(/deviation-alerts\/(\d+)\/resolutions$/);
  const alertDetail = path.match(/deviation-alerts\/(\d+)$/);
  if (path.endsWith('/users/me/onboarding')) body = { userId: 27, laboratoryId: 42, subscriptionId: 73, subscriptionStatus: 'ACTIVE', nextStep: 'READY' };
  else if (path.endsWith('/users/me/profile')) body = { userId: 27, staffId: null, username: 'fixture', email: null, roles: [], fullName: 'Alerts Fixture', dni: null, phoneNumber: null, location: null, position: null, hasPhoto: false };
  else if (path.endsWith('/laboratories/42')) body = { id: 42, name: 'Multilab', ownerId: 27 };
  else if (path.endsWith('/laboratories/42/environments')) body = environments;
  else if (path.endsWith('/laboratories/42/staff')) body = [{ fullName: 'Billy Ruiz', userId: 12 }];
  else if (path.endsWith('/api/v1/users')) body = [{ id: 12, username: 'billy@lab.pe' }, { id: 27, username: 'fixture@lab.pe' }];
  else if (path.endsWith('/equipments')) body = devices;
  else if (environmentAlerts) {
    const environmentId = Number(environmentAlerts[1]);
    if (state.failing.has(environmentId)) status = 503;
    else body = state.alerts[environmentId] ?? [];
  } else if (acknowledgement && method === 'POST') {
    const alertId = Number(acknowledgement[1]);
    state.acknowledgements.push(alertId);
    status = state.acknowledgeStatus;
    const alert = Object.values(state.alerts).flat().find((item) => item.id === alertId);
    if (status === 200) {
      Object.assign(alert, { status: 'ACKNOWLEDGED', acknowledgedBy: 27, acknowledgedAt: new Date().toISOString() });
      body = alert;
    } else {
      body = { details: 'Already attended' };
    }
  } else if (resolution && method === 'POST') {
    const alertId = Number(resolution[1]);
    state.resolutions.push({ alertId, notes: requestBody?.resolutionNotes });
    body = Object.values(state.alerts).flat().find((item) => item.id === alertId);
    Object.assign(body, { status: 'RESOLVED', resolvedBy: 27, resolvedAt: new Date().toISOString(), resolutionNotes: requestBody?.resolutionNotes });
  } else if (alertDetail) {
    body = [...Object.values(state.alerts).flat(), resolvedAlert].find((item) => item.id === Number(alertDetail[1]));
  }
  return { status, body };
}

/** Opens the inbox on an isolated session; nothing reaches a real platform. */
async function openInbox(browser, { width = 1280, height = 900, roles = '["ROLE_QA_MANAGER"]', api, intercepted = true, platformState } = {}) {
  const context = await browser.newContext({ viewport: { width, height }, locale: 'es-PE' });
  await context.addInitScript((sessionRoles) => {
    localStorage.setItem('token', 'test.' + btoa(JSON.stringify({ exp: Date.now() / 1000 + 3600 })) + '.test');
    localStorage.setItem('userId', '27');
    localStorage.setItem('username', 'Alerts fixture');
    localStorage.setItem('roles', sessionRoles);
  }, roles);
  const state = platformState ?? newPlatformState();
  if (intercepted) {
    await context.route('**/api/v1/**', async (route) => {
      const request = route.request();
      const { status, body } = answerOf(state, request.method(), new URL(request.url()).pathname, request.postDataJSON());
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    });
  }
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await api?.(state);
  await page.goto(origin + '/alerts');
  await page.getByRole('radio', { name: 'Español', exact: true }).click();
  await page.locator('app-alert-card, app-empty-state, app-action-banner').first().waitFor();
  return { context, page, state, errors };
}

const titles = (page) => page.locator('app-alert-card h2').allInnerTexts();
const cardsShown = (page, count) =>
  page.waitForFunction((expected) => document.querySelectorAll('app-alert-card').length === expected, count);
const statusShown = (page, device, status) =>
  page.locator('app-alert-card', { hasText: device })
    .locator(status === 'Abierta' ? '.owner.unowned' : '.owner:not(.unowned)', status === 'Abierta' ? {} : { hasText: status })
    .waitFor();
/** Link of the title of a row, which opens its detail. */
const titleLink = (page, device) => page.locator('app-alert-card', { hasText: device }).first().locator('h2 a');
/** Chip of the inbox whose name starts with the given words. */
const inboxChip = (page, name) => page.locator('app-filter-chip button', { hasText: name });
const attendButton = (page, device) =>
  page.locator('app-alert-card', { hasText: device }).getByRole('button', { name: /Registrar atención/ });
/** Elements of the inbox past the right edge of the page, which the scrolling container hides; the tabs scroll by themselves. */
const overflowing = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('main.operations-page *')]
      .filter((element) => !element.closest('.mat-mdc-tab-header'))
      .filter((element) => element.getBoundingClientRect().right > document.documentElement.clientWidth + 1)
      .map((element) => element.tagName + '.' + element.className),
  );

/**
 * Answers on the address of the platform in development, because a request sent while the page goes away is lost when
 * the browser intercepts it. Port 8080 must be free, so stop a local platform before running this test.
 */
async function withRealPlatform(run) {
  const state = newPlatformState();
  const authorizations = [];
  const server = createServer((request, response) => {
    response.setHeader('Access-Control-Allow-Origin', request.headers.origin ?? '*');
    response.setHeader('Access-Control-Allow-Headers', 'authorization,content-type');
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    if (request.method === 'OPTIONS') return response.writeHead(204).end();
    const path = request.url.split('?')[0];
    if (path.endsWith('/acknowledgements')) authorizations.push(Boolean(request.headers.authorization));
    const { status, body } = answerOf(state, request.method, path);
    response.writeHead(status, { 'Content-Type': 'application/json' }).end(JSON.stringify(body));
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(8080, resolve);
  });
  try {
    await run(state, authorizations);
  } finally {
    server.close();
  }
}

const browser = await chromium.launch();
try {
  // Every environment, the most urgent first.
  {
    const { context, page, errors } = await openInbox(browser);
    const order = await titles(page);
    assert.match(order[0], /Refrigerador CF-01/);
    assert.match(order[1], /PROD-SOL/);
    assert.match(order[2], /ALM-MP/);
    // The critical alerts nobody attends are counted in a red chip, which leaves only them.
    const urgent = inboxChip(page, 'Críticas sin atender');
    assert.match(await urgent.innerText(), /2/);
    await urgent.click();
    await cardsShown(page, 2);
    assert.equal(await urgent.getAttribute('aria-pressed'), 'true');
    await inboxChip(page, 'Todas').click();
    await cardsShown(page, 4);
    // The alerts are grouped by severity, the most serious first; each group says how many it holds.
    const groups = await page.locator('.group-title').allInnerTexts();
    assert.deepEqual(groups.map((name) => name.replace(/\s*\d+\s*$/, '').trim()), ['CRÍTICAS', 'ADVERTENCIAS']);
    await page.getByRole('searchbox').fill('refrigerador');
    await cardsShown(page, 1);
    await page.getByRole('searchbox').fill('');
    await cardsShown(page, 4);
    await page.screenshot({ path: `${directory}/inbox-1280.png`, fullPage: true });
    assert.deepEqual(errors, []);
    await context.close();
  }

  // Attention waits for the time to undo, which can stop.
  {
    const { context, page, state, errors } = await openInbox(browser);
    await attendButton(page, 'Refrigerador').click();
    await statusShown(page, 'Refrigerador', 'En atención');
    assert.deepEqual(state.acknowledgements, []);
    await page.screenshot({ path: `${directory}/undo-window.png` });
    await page.waitForFunction(() => /^Resolver: .*Refrigerador/.test(document.activeElement?.getAttribute('aria-label') ?? ''));
    await page.getByRole('button', { name: 'Deshacer' }).click();
    await page.locator('app-undo-toast').waitFor({ state: 'detached' });
    await statusShown(page, 'Refrigerador', 'Abierta');
    await page.waitForTimeout(5500);
    assert.deepEqual(state.acknowledgements, [], 'Undone attention must never reach the platform');

    await attendButton(page, 'Refrigerador').click();
    await page.locator('app-undo-toast').waitFor({ state: 'detached', timeout: 7000 });
    assert.deepEqual(state.acknowledgements, [102]);
    await statusShown(page, 'Refrigerador', 'En atención');
    assert.deepEqual(errors, []);
    await context.close();
  }

  // A second attention closes the time to undo the first one.
  {
    const { context, page, state } = await openInbox(browser);
    await attendButton(page, 'Refrigerador').click();
    await attendButton(page, 'PROD-SOL').click();
    await page.waitForTimeout(600);
    assert.deepEqual(state.acknowledgements, [102]);
    await context.close();
  }

  // Whatever way the person leaves, what was waiting is sent once and with the session.
  {
    const leavingWays = {
      'going to another address': (page) => page.goto('about:blank'),
      'reloading': (page) => page.reload(),
      'closing the tab': async (page, context) => {
        await context.newPage();
        await page.close({ runBeforeUnload: false });
      },
      'signing out': (page) => page.locator('app-user-session-section button').first().click(),
    };
    for (const [way, leave] of Object.entries(leavingWays)) {
      await withRealPlatform(async (state, authorizations) => {
        const { context, page } = await openInbox(browser, { intercepted: false, platformState: state });
        await attendButton(page, 'Refrigerador').click();
        await leave(page, context);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        assert.deepEqual(state.acknowledgements, [102], way);
        assert.deepEqual(authorizations, [true], way);
        await context.close();
      });
    }
  }

  // Moving on inside the application keeps the time to undo running.
  {
    const { context, page, state } = await openInbox(browser);
    await attendButton(page, 'Refrigerador').click();
    await page.getByRole('tab', { name: /Historial/ }).click();
    await page.waitForURL('**/alerts/history');
    assert.deepEqual(state.acknowledgements, []);
    await page.locator('app-undo-toast').waitFor({ state: 'detached', timeout: 7000 });
    assert.deepEqual(state.acknowledgements, [102]);
    await context.close();
  }

  // Opening the alert that is waiting sends it first.
  {
    const { context, page, state } = await openInbox(browser);
    await attendButton(page, 'Refrigerador').click();
    await titleLink(page, 'Refrigerador').click();
    await page.waitForURL('**/alerts/102');
    await page.getByRole('dialog').waitFor();
    assert.deepEqual(state.acknowledgements, [102]);
    await context.close();
  }

  // Another person got there first.
  {
    const { context, page, state } = await openInbox(browser, { width: 1280, height: 500 });
    state.acknowledgeStatus = 409;
    await attendButton(page, 'Refrigerador').click();
    state.alerts[2][0].status = 'ACKNOWLEDGED';
    state.alerts[2][0].acknowledgedAt = new Date().toISOString();
    await page.locator('app-undo-toast').waitFor({ state: 'detached', timeout: 7000 });
    await page.getByText('Otra persona ya atendió esta alerta.').waitFor();
    await page.waitForFunction(() => {
      const banner = document.querySelector('app-error-banner').getBoundingClientRect();
      return banner.top >= 0 && banner.bottom <= window.innerHeight;
    });
    await statusShown(page, 'Refrigerador', 'En atención');
    await context.close();
  }

  // An environment that does not answer does not hide the others, and never reads as good news.
  {
    const { context, page, state, errors } = await openInbox(browser, {
      api: async (fixtureState) => {
        fixtureState.failing.add(2);
      },
    });
    await page.getByText(/No se pudieron leer las alertas de: CAD-FRIO-01/).waitFor();
    await cardsShown(page, 3);
    state.failing.clear();
    await page.getByRole('button', { name: 'Reintentar' }).click();
    await page.locator('app-alert-card', { hasText: 'Refrigerador' }).waitFor();
    await page.getByText(/No se pudieron leer/).waitFor({ state: 'detached' });
    assert.deepEqual(errors, []);
    await context.close();
  }

  // Nothing open is good news.
  {
    const { context, page } = await openInbox(browser, {
      api: async (fixtureState) => {
        fixtureState.alerts = {};
      },
    });
    await page.getByRole('heading', { name: 'Todo dentro de los parámetros BPM' }).waitFor();
    await page.getByText('No hay alertas abiertas en los 3 ambientes.').waitFor();
    await page.screenshot({ path: `${directory}/all-clear.png` });
    await context.close();
  }

  // Auditors only consult.
  {
    const { context, page } = await openInbox(browser, { roles: '["ROLE_AUDITOR"]' });
    assert.equal(await page.getByRole('button', { name: /Registrar atención/ }).count(), 0);
    assert.equal(await page.getByRole('link', { name: /^Resolver/ }).count(), 0);
    assert.equal(await page.getByRole('link', { name: /Ver detalle/ }).count(), 4);
    await context.close();
  }

  // The chosen environment lives in the address and is shown in full.
  {
    const { context, page } = await openInbox(browser);
    await page.locator('app-environment-selector mat-select').click();
    await page.getByRole('option', { name: /CAD-FRIO-01/ }).click();
    await page.waitForURL('**/alerts?environmentId=2');
    await cardsShown(page, 1);
    const selected = page.locator('app-environment-selector .inline-trigger');
    assert.match(await selected.innerText(), /CAD-FRIO-01/);
    assert.ok(
      await selected.evaluate((trigger) => trigger.getBoundingClientRect().right <= document.documentElement.clientWidth),
      'The environment selector stays inside the page',
    );
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${directory}/one-environment.png` });
    await context.close();
  }

  // The detail opens over the list, keeps the focus and gives it back.
  {
    const { context, page, errors } = await openInbox(browser, { height: 500 });
    await page.getByRole('searchbox').fill('alm-mp');
    const details = titleLink(page, 'ALM-MP');
    await details.focus();
    await details.click();
    await page.waitForURL('**/alerts/103');
    const dialog = page.getByRole('dialog');
    await dialog.getByText('En atención por Billy Ruiz').first().waitFor();
    assert.equal(await page.getByRole('searchbox').inputValue(), 'alm-mp', 'The list stays as it was');
    assert.ok(await page.locator('app-alert-card').count(), 'The list stays behind');
    await page.waitForFunction(() => document.activeElement?.classList.contains('title'));
    assert.match(await dialog.getAttribute('aria-labelledby'), /side-panel-title/);
    assert.match(await page.evaluate(() => document.activeElement.textContent), /ALM-MP/);

    const toolbarIsCovered = await page.evaluate(() => {
      const bell = document.querySelector('app-notification-bell').getBoundingClientRect();
      return !document.elementFromPoint(bell.x + bell.width / 2, bell.y + bell.height / 2).closest('.toolbar');
    });
    assert.ok(toolbarIsCovered, 'Nothing behind the panel can be used');

    for (let press = 0; press < 25; press++) {
      await page.keyboard.press('Tab');
      assert.ok(await page.evaluate(() => Boolean(document.activeElement.closest('[role="dialog"]'))), 'The focus stays in the panel');
    }
    await page.screenshot({ path: `${directory}/panel-1280.png` });

    await page.keyboard.press('Escape');
    await page.waitForURL('**/alerts');
    await dialog.waitFor({ state: 'detached' });
    await page.waitForFunction(() => /ALM-MP/.test(document.activeElement?.textContent ?? ''), null, { timeout: 5000 });
    assert.deepEqual(errors, []);
    await context.close();
  }

  // Resolving with a template, without leaving the list.
  {
    const { context, page, state, errors } = await openInbox(browser);
    await page.locator('app-alert-card', { hasText: 'ALM-MP' }).first().getByRole('link', { name: /^Resolver/ }).click();
    await page.waitForURL('**/alerts/103?panel=resolve');
    await page.waitForFunction(() => document.activeElement?.tagName === 'TEXTAREA');
    const notes = page.getByRole('dialog').locator('textarea');

    await notes.fill('Corto');
    await page.getByRole('dialog').getByRole('button', { name: 'Resolver' }).click();
    await page.getByText('Escribe entre 10 y 500 caracteres.').waitFor();
    assert.deepEqual(state.resolutions, []);

    await notes.fill('');
    await page.getByRole('button', { name: 'Filtro reemplazado' }).click();
    assert.match(await notes.inputValue(), /Se reemplazó el filtro/);
    await page.getByRole('button', { name: 'Sensor recalibrado' }).click();
    assert.match(await notes.inputValue(), /filtro.*recalibró el sensor/, 'A template never loses what is written');
    await page.screenshot({ path: `${directory}/panel-resolve.png` });
    await page.getByRole('dialog').getByRole('button', { name: 'Resolver' }).click();

    await page.getByRole('dialog').waitFor({ state: 'detached' });
    await page.waitForURL('**/alerts');
    assert.equal(state.resolutions[0].alertId, 103);
    await page.getByText('La alerta quedó resuelta.').waitFor();
    await cardsShown(page, 3);
    await page.waitForFunction(() => document.activeElement?.classList.contains('alert-card'));
    assert.deepEqual(errors, []);
    await context.close();
  }

  // Attention registered in the panel can be undone there too, and the toast can be reached.
  {
    const { context, page, state } = await openInbox(browser, { width: 375, height: 700 });
    await titleLink(page, 'Refrigerador').click();
    const dialog = page.getByRole('dialog');
    await dialog.getByText(/Pendiente: nadie/).waitFor();
    await page.waitForTimeout(300); // The panel finishes sliding in.
    assert.equal(Math.round((await dialog.boundingBox()).width), 375, 'The panel takes the whole width of a phone');
    assert.deepEqual(await page.evaluate(() =>
      [...document.querySelectorAll('[role="dialog"] *')].filter((element) => element.getBoundingClientRect().right > innerWidth + 1).map((element) => element.tagName)), []);
    await page.screenshot({ path: `${directory}/panel-375.png` });

    await dialog.getByRole('button', { name: /Registrar atención/ }).click();
    await dialog.getByText('En atención por Alerts Fixture').waitFor();
    await page.locator('app-undo-toast').waitFor();
    const toastOnTop = await page.evaluate(() => {
      const toast = document.querySelector('app-undo-toast .undo-action').getBoundingClientRect();
      return Boolean(document.elementFromPoint(toast.x + toast.width / 2, toast.y + toast.height / 2).closest('app-undo-toast'));
    });
    assert.ok(toastOnTop, 'The toast is not hidden behind the panel');
    let reached = false;
    for (let press = 0; press < 40 && !reached; press++) {
      await page.keyboard.press('Tab');
      reached = await page.evaluate(() => Boolean(document.activeElement.closest('app-undo-toast')));
    }
    assert.ok(reached, 'The undo button can be reached with the keyboard');
    await page.keyboard.press('Enter');
    await dialog.getByRole('button', { name: /Registrar atención/ }).waitFor();
    assert.deepEqual(state.acknowledgements, []);
    await context.close();
  }

  // A link from outside opens the detail over the list; a resolved alert only reads and closes back to where it came from.
  // Loading the page again goes back to English, and the language can no longer be changed from behind the panel.
  {
    const { context, page, errors } = await openInbox(browser);
    await page.goto(origin + '/alerts/105');
    const dialog = page.getByRole('dialog');
    await dialog.getByText('Resolved by Alerts Fixture').waitFor();
    await dialog.getByText('Se reemplazó el filtro HEPA del almacén.').waitFor();
    await dialog.getByText('In progress by Billy Ruiz').waitFor();
    assert.equal(await dialog.locator('form').count(), 0);
    assert.equal(await dialog.getByRole('button', { name: /attention/i }).count(), 0);
    await page.locator('app-alert-card').first().waitFor();
    await dialog.getByRole('button', { name: 'Close' }).click();
    await page.waitForURL('**/alerts');
    await dialog.waitFor({ state: 'detached' });
    await page.locator('app-alert-card').first().waitFor();

    await page.getByRole('tab', { name: /History/ }).click();
    await page.waitForURL('**/alerts/history');
    await page.locator('app-environment-selector mat-select').click();
    await page.getByRole('option', { name: /CAD-FRIO-01/ }).click();
    await page.locator('app-alert-table a[href*="/alerts/history/102"]').click();
    await page.waitForURL('**/alerts/history/102**');
    await dialog.waitFor();
    await dialog.getByRole('button', { name: 'Close' }).click();
    await page.waitForURL('**/alerts/history**');
    await dialog.waitFor({ state: 'detached' });

    await page.goto(origin + '/alerts/deviation-detail/103');
    await page.waitForURL('**/alerts/103');
    await dialog.waitFor();
    assert.deepEqual(errors, []);
    await context.close();
  }

  // An alert that does not exist says so, and the list is still there.
  {
    const { context, page } = await openInbox(browser, { api: async () => {} });
    await context.route('**/deviation-alerts/999', (route) => route.fulfill({ status: 404, contentType: 'application/json', body: '{}' }));
    await page.goto(origin + '/alerts/999');
    await page.getByRole('dialog').getByRole('alert').waitFor();
    await page.locator('app-alert-card').first().waitFor();
    await page.keyboard.press('Escape');
    await page.waitForURL('**/alerts');
    assert.equal(await page.locator('.feedback').count(), 0, 'The failure goes away with the panel');
    await context.close();
  }

  // The environment chosen survives opening and closing the detail.
  {
    const { context, page, state } = await openInbox(browser);
    await page.goto(origin + '/alerts?environmentId=2');
    await cardsShown(page, 1);
    await page.locator('app-alert-card h2 a').first().click();
    await page.waitForURL('**/alerts/102?environmentId=2');
    await page.keyboard.press('Escape');
    await page.waitForURL('**/alerts?environmentId=2');
    await cardsShown(page, 1);
    assert.equal(state.resolutions.length, 0);
    await context.close();
  }

  // With the focus on the list, the keyboard goes through the cards and attends.
  {
    const { context, page, state } = await openInbox(browser);
    const focusedCard = () => page.evaluate(() => document.activeElement.closest('app-alert-card')?.querySelector('h2').textContent);
    await page.keyboard.press('j');
    assert.equal(await focusedCard(), undefined, 'Nothing happens away from the list');
    await page.locator('app-alert-card h2 a').first().focus();
    assert.match(await focusedCard(), /Refrigerador/);
    await page.keyboard.press('j');
    assert.match(await focusedCard(), /PROD-SOL/);
    await page.keyboard.press('k');
    assert.match(await focusedCard(), /Refrigerador/);
    await page.keyboard.press('a');
    await statusShown(page, 'Refrigerador', 'En atención');
    await page.locator('app-undo-toast').waitFor();
    assert.deepEqual(state.acknowledgements, []);
    await page.getByRole('searchbox').focus();
    await page.keyboard.type('aj');
    assert.equal(await page.getByRole('searchbox').inputValue(), 'aj', 'Typing is typing');
    await context.close();
  }

  // Typing a date goes through years such as 0202: the chart stays small and the browser history does not fill up.
  {
    const { context, page, errors } = await openInbox(browser);
    await page.goto(origin + '/alerts/history?period=custom');
    await page.locator('app-alert-table tbody tr').first().waitFor();
    assert.ok((await page.locator('app-alert-table tbody tr').count()) <= 10, 'The history shows ten rows at a time');
    const entries = await page.evaluate(() => history.length);
    await page.locator('input[type=date]').first().click({ position: { x: 8, y: 8 } });
    await page.keyboard.type('0110202', { delay: 30 });
    await page.waitForURL('**from=0202-10-01**');
    await page.waitForTimeout(200);
    assert.ok((await page.locator('app-alert-week-chart tbody tr').count()) < 110, 'The chart must not draw centuries of empty weeks');
    await page.keyboard.press('6');
    await page.waitForURL('**from=2026-10-01**');
    assert.equal(await page.evaluate(() => history.length), entries);

    // A day that does not exist is ignored.
    await page.goto(origin + '/alerts/history?period=custom&to=2026-13-45');
    await page.locator('app-alert-table tbody tr').first().waitFor();

    // The report does not follow the chips, and the page says so only when one is pressed.
    assert.equal(await page.locator('.export-note').count(), 0);
    // The chips live in the foldable row of the toolbar, folded on a phone.
    const toggle = page.locator('app-list-toolbar .toggle');
    if ((await toggle.getAttribute('aria-expanded')) === 'false') await toggle.click();
    await page.locator('app-filter-chip button').filter({ hasText: 'Critical' }).click();
    await page.locator('.export-note').waitFor();
    assert.deepEqual(errors, []);
    await context.close();
  }

  // No width scrolls sideways.
  for (const width of [1440, 1024, 768, 375, 320]) {
    const { context, page, errors } = await openInbox(browser, { width, height: 3200 });
    assert.deepEqual(await overflowing(page), [], `Sideways scroll at ${width} px`);
    await page.locator('main.operations-page').screenshot({ path: `${directory}/inbox-${width}.png` });
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log('Alerts browser checks passed');
} finally {
  await browser.close();
}
