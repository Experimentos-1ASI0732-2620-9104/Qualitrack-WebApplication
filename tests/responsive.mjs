import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

// Isolated browser fixtures. These are never loaded by the application runtime.
const origin = process.env.WEB_URL ?? 'http://localhost:4200';
const populated = process.env.DATASET === 'recorded';
const directory = process.env.OUTPUT_DIR ?? (populated ? 'test-results/visual-recorded' : 'test-results/visual');
const widths = (process.env.WIDTHS ?? '320,360,375,390,412,768,1024,1280,1440').split(',').map(Number);
const paths = process.env.ROUTES?.split(',') ?? ['/home', '/about', '/iam/sign-in', '/iam/sign-up', '/not-found',
  '/subscriptions/plans', '/subscriptions/checkout?plan=TEST&billingCycle=MONTHLY',
  '/subscriptions/success', '/subscriptions/cancel', '/laboratories/create', '/dashboard',
  '/laboratories/lab-profile', '/laboratories/staff-list', '/laboratories/staff-form',
  '/laboratories/product-catalog', '/laboratories/product-form', '/laboratories/raw-material-list',
  '/laboratories/raw-material-form', '/equipments/equipment-list', '/equipments/register-equipment',
  '/batches/batch-list', '/batches/batch-form', '/alerts/alert-dashboard', '/alerts/alert-history',
  '/alerts/notification-settings', '/tracking/dashboard', '/tracking/analysis', '/tracking/history',
  '/reports/kpi-dashboard', '/reports/deviation-trends', '/reports/report-generator', '/reports/audit-log'];
const plan = { id: 91, code: 'TEST', name: 'Browser test plan', description: 'Isolated test fixture',
  amount: 9, currency: 'USD', billingCycle: 'MONTHLY', stripePriceId: 'price_test_only',
  maxUsers: 5, maxEquipment: 10, active: true };
const laboratory = { id: 42, name: 'Browser test laboratory', ruc: '20123456789',
  address: 'Test address', phone: '999999999', applicableRegulations: [],
  createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z' };
const browser = await chromium.launch({ headless: true });
const equipment = { id: 23, laboratoryId: 42, name: 'Browser test equipment', type: 'SENSOR',
  model: 'TEST', serialNumber: 'TEST-23', status: 'OPERATIONAL', createdAt: '2026-09-01T00:00:00Z' };
const batch = { id: 31, labId: 42, productId: 41, productName: 'Browser test product',
  batchNumber: 'TEST-31', quantity: 10, unit: 'kg', status: 'PENDING', startDate: '2026-09-01T00:00:00Z' };
const history = [20.0, 21.5, 22.0].map((value, index) => ({ id: 51 + index, equipmentId: 23,
  parameterName: 'Temperature', recordedValue: value, timestamp: `2026-09-01T10:0${index}:00Z`,
  isAnomaly: false, createdAt: '2026-09-01T00:00:00Z' }));
const results = [];
await mkdir(directory, { recursive: true });
try {
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 900 } });
    await context.addInitScript(() => {
      localStorage.setItem('token', 'test.' + btoa(JSON.stringify({ exp: Date.now() / 1000 + 3600 })) + '.test');
      localStorage.setItem('userId', '27');
      localStorage.setItem('username', 'Browser test user');
      localStorage.setItem('roles', '["ROLE_QA_MANAGER"]');
      // Deliberately untrusted: onboarding must replace this with the server's 42.
      localStorage.setItem('laboratoryId', '999');
    });
    let currentPath = '';
    await context.route('**/api/v1/**', async (route) => {
      const path = new URL(route.request().url()).pathname;
      let body = [];
      if (path.endsWith('/users/me/onboarding')) {
        const subscription = currentPath.startsWith('/subscriptions/') && currentPath !== '/subscriptions/billing-summary';
        const setup = currentPath === '/laboratories/create';
        body = { userId: 27, laboratoryId: subscription || setup ? null : 42,
          subscriptionId: subscription ? null : 73, subscriptionStatus: subscription ? null : 'ACTIVE',
          nextStep: subscription ? 'SUBSCRIPTION' : setup ? 'LABORATORY' : 'READY' };
      } else if (path === '/api/v1/laboratories/42') body = laboratory;
      else if (path.endsWith('/subscription-plans')) body = [plan];
      else if (path.endsWith('/kpi-dashboards')) body = { id: null, laboratoryId: 42,
        timestamp: '2026-09-01T00:00:00Z', overallHealthScore: null, metrics: [] };
      else if (path.endsWith('/notification-preferences')) body = { id: 89, userId: 27,
        emailEnabled: false, smsEnabled: false, inAppEnabled: false, minimumSeverity: 'WARNING' };
      if (populated) {
        if (path === '/api/v1/equipments') body = [equipment];
        if (path === '/api/v1/equipments/23') body = equipment;
        if (path.endsWith('/batches')) body = [batch];
        if (path === '/api/v1/batches/31') body = batch;
        if (path === '/api/v1/deviation-alerts/83') body = { id: 83, equipmentId: 23, batchId: 31,
          parameterName: 'Temperature', recordedValue: 26, thresholdValue: 24, unit: 'C',
          timestamp: history[2].timestamp, severity: 'WARNING', status: 'UNRESOLVED' };
        if (path === '/api/v1/laboratories/42/subscriptions') body = [{ id: 73, userId: 27, laboratoryId: 42,
          planCode: 'BASIC', billingCycle: 'MONTHLY', status: 'ACTIVE',
          stripeSubscriptionId: 'sub_browser_fixture', stripeCustomerId: 'cus_browser_fixture',
          currentPeriodStart: '2026-09-01T00:00:00Z', currentPeriodEnd: '2026-10-01T00:00:00Z',
          createdAt: '2026-09-01T00:00:00Z', updatedAt: '2026-09-01T00:00:00Z' }];
        if (process.env.PAYMENTS === 'recorded' && path === '/api/v1/subscriptions/73/payments') body = [{
          id: 92, subscriptionId: 73, provider: 'Stripe', providerPaymentId: 'pi_browser_fixture',
          amount: 9, currency: 'USD', status: 'PAID', paidAt: '2026-09-01T00:00:00Z' }];
        if (path.endsWith('/kpi-dashboards')) body.metrics = ['equipment-count', 'batch-count'].map(name => ({
          id: null, name, value: 1, unit: 'count', targetValue: null, status: 'UNKNOWN', recordedAt: body.timestamp }));
        if (path.endsWith('/telemetry-history')) body = history;
        if (path.endsWith('/telemetry-measurements')) body = [{ ...history[2], value: history[2].recordedValue, unit: 'C' }];
        if (path.endsWith('/telemetry-status')) body = { id: 61, equipmentId: 23, isOnline: true,
          currentStatus: 'OPERATIONAL', lastHeartbeat: history[2].timestamp, createdAt: history[0].createdAt };
        if (path.endsWith('/deviation-trends')) body = [{ id: null, parameterName: 'Temperature',
          equipmentId: 23, trendDirection: 'INCREASING', dataPoints: history.map(item => ({ ...item, upperThreshold: 24, lowerThreshold: 18 })) }];
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    });
    const page = await context.newPage();
    let errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const path of paths) {
      currentPath = path;
      errors = [];
      await page.goto(origin + path);
      await page.waitForLoadState('networkidle');
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(600);
      const measurements = await page.evaluate(() => {
        const viewport = innerWidth;
        const content = document.querySelector('mat-sidenav-content');
        const drawer = document.querySelector('mat-sidenav');
        const scrollableContent = content && content.scrollWidth > content.clientWidth + 2;
        const clipped = [...document.querySelectorAll('button, input, h1, h2, h3, mat-card, mat-form-field, canvas, th, td, p')]
          .filter(element => {
            const rect = element.getBoundingClientRect();
            if (!rect.width || !rect.height || rect.bottom < 0 || rect.top > innerHeight) return false;
            if (element.closest('mat-sidenav') && !drawer?.classList.contains('mat-drawer-opened')) return false;
            if (rect.right <= viewport + 2 && rect.left >= -2) return false;
            for (let parent = element.parentElement; parent; parent = parent.parentElement) {
              if (parent === content) break;
              if (['auto', 'scroll'].includes(getComputedStyle(parent).overflowX)) return false;
            }
            return true;
          }).map(element => ({ tag: element.tagName, text: element.textContent?.trim().slice(0, 60),
            class: element.className, right: Math.round(element.getBoundingClientRect().right) }));
        const canvases = [...document.querySelectorAll('canvas')].map(canvas => {
          const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
          let painted = 0;
          for (let index = 3; index < pixels.length; index += 4) if (pixels[index]) painted++;
          return { width: canvas.width, height: canvas.height, painted };
        });
        const untranslated = document.body.innerText.match(/\b(?:tracking|onboarding|operational-metrics|ca-alerts)\.[a-z][\w.-]+\b/g) ?? [];
        return { pageWidth: document.documentElement.scrollWidth, scrollableContent, canvases, untranslated,
          contentMargin: content ? getComputedStyle(content).marginLeft : null,
          drawerOpen: drawer?.classList.contains('mat-drawer-opened'), clipped };
      });
      if (width === widths[0] || width === 1440) {
        await page.screenshot({ path: `${directory}/${width}-${path.split('?')[0].replaceAll('/', '_')}.png` });
      }
      results.push({ width, path, finalPath: new URL(page.url()).pathname, ...measurements, errors: [...errors] });
    }
    await context.close();
    console.log(`Checked ${paths.length} views at ${width}px`);
  }
} finally {
  await browser.close();
  await writeFile(`${directory}/results.json`, JSON.stringify(results, null, 2));
}
const failures = results.filter(result => result.pageWidth > result.width + 2 || result.scrollableContent ||
  result.untranslated.length ||
  result.canvases?.some(canvas => !canvas.painted) ||
  result.clipped.length || result.errors.length || (result.width < 1024 && result.contentMargin && result.contentMargin !== '0px'));
console.log(JSON.stringify({ checked: results.length, failures }, null, 2));
process.exitCode = failures.length ? 1 : 0;
