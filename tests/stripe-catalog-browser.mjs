import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { randomBytes, randomUUID } from 'node:crypto';

const origin = process.env.WEB_URL ?? 'http://localhost:4200';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(origin).hostname), 'Local test only');
const output = 'test-results/catalog-tests';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const username = 'catalog-test-' + randomUUID();
  const password = randomBytes(24).toString('base64url') + 'aA1!';
  await page.goto(origin + '/iam/sign-up?role=qa-manager');
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(password);
  await page.locator('#confirmPassword').fill(password);
  await page.locator('button[type=submit]').click();
  await page.waitForURL('**/iam/sign-in');
  await page.locator('#username').fill(username);
  await page.locator('#password').fill(password);
  const plansResponse = page.waitForResponse(response => response.url().endsWith('/subscription-plans'));
  await page.locator('button[type=submit]').click();
  await page.waitForURL('**/subscriptions/plans');
  const response = await plansResponse;
  assert.equal(response.status(), 200);
  const plans = await response.json();
  assert.equal(plans.length, 4);
  assert.deepEqual(plans.filter(plan => plan.code === 'BASIC').map(plan => plan.amount).sort((a, b) => a - b), [199, 1990]);
  assert.deepEqual(plans.filter(plan => plan.code === 'ENTERPRISE').map(plan => plan.amount).sort((a, b) => a - b), [599, 5990]);
  assert.ok(plans.filter(plan => plan.code === 'BASIC').every(plan => plan.maxUsers === 10 && plan.maxEquipment === 5));
  assert.ok(plans.filter(plan => plan.code === 'ENTERPRISE').every(plan => plan.maxUsers === 10 && plan.maxEquipment === null));
  await page.locator('.plan-card').nth(3).waitFor();
  assert.equal(await page.getByText('Unlimited', { exact: true }).count(), 2);
  results.push('Four source-backed plans served by the real local API; Enterprise equipment is unlimited');

  for (const language of ['English', 'Español']) {
    await page.getByRole('radio', { name: language, exact: true }).click();
    await page.getByRole('radio', { name: language, exact: true, checked: true }).waitFor();
    const unlimited = language === 'English' ? 'Unlimited' : 'Ilimitados';
    await page.getByText(unlimited, { exact: true }).first().waitFor();
    for (const width of [320, 375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.evaluate(() => document.fonts.ready);
      const layout = await page.evaluate(() => ({
        width: innerWidth,
        content: document.documentElement.scrollWidth,
        overflow: [...document.querySelectorAll('.plan-card, .limits-grid > div, .price-block')]
          .filter(element => element.scrollWidth > element.clientWidth + 1).map(element => element.className),
        unresolved: document.body.innerText.includes('{{count}}'),
      }));
      assert.ok(layout.content <= layout.width + 1, JSON.stringify(layout));
      assert.deepEqual(layout.overflow, [], JSON.stringify(layout));
      assert.equal(layout.unresolved, false);
      await page.screenshot({ path: `${output}/${language === 'English' ? 'en' : 'es'}-${width}.png`, fullPage: true, animations: 'disabled' });
      results.push(`${language}: ${width}px without horizontal overflow`);
    }
  }

  await page.getByRole('radio', { name: 'English', exact: true }).click();
  await page.locator('.plan-card').filter({ hasText: 'Standard Lab Plan' }).first()
    .getByRole('button', { name: 'Select Plan', exact: true }).click();
  await page.waitForURL('**/subscriptions/checkout?**');
  await page.locator('.summary-row.total').getByText('USD 199', { exact: true }).waitFor();
  results.push('Standard monthly selection reaches checkout with USD 199');

  if (process.env.RUN_STRIPE_CHECKOUT === '1') {
    const sessionResponse = page.waitForResponse(response => response.url().endsWith('/subscription-checkout-sessions'));
    await page.locator('mat-card-actions button').last().click();
    const session = await sessionResponse;
    assert.ok(session.ok(), `Checkout creation returned HTTP ${session.status()}`);
    await page.waitForURL('https://checkout.stripe.com/**', { timeout: 30000 });
    assert.ok(new URL(page.url()).pathname.includes('cs_test_'), 'Expected a TEST checkout session');
    await page.getByText('Standard Lab Plan', { exact: false }).first().waitFor({ timeout: 45000 });
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await page.screenshot({ path: `${output}/stripe-test-checkout.png`, fullPage: true, animations: 'disabled' });
    results.push('Actual Stripe TEST checkout session created and opened; no payment submitted');
  }

  await page.goto(origin + '/about');
  assert.equal(await page.title(), 'QualiTrack | IoTech');
  await page.getByText('IoTech Team', { exact: true }).waitFor();
  results.push('About view identifies the team as IoTech');
} finally {
  await browser.close();
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
}
console.log(results.join('\n'));
