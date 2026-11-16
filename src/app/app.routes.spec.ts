import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, Routes, provideRouter } from '@angular/router';
import english from '../../public/i18n/en.json';
import spanish from '../../public/i18n/es.json';
import { routes } from './app.routes';
import { batchRoutes } from './batch/presentation/batch.routes';
import { caRoutes } from './ca/presentation/ca.routes';
import { equipmentRoutes } from './equipment/presentation/equipment.routes';
import { IamStore } from './iam/application/iam.store';
import { iamRoutes } from './iam/presentation/iam.routes';
import { inventoryRoutes } from './inventory/presentation/inventory.routes';
import { laboratoryRoutes } from './laboratory/presentation/laboratory.routes';
import { profileRoutes } from './profile/presentation/profile.routes';
import { raRoutes } from './ra/presentation/ra.routes';
import { SubscriptionStore } from './subscription/application/subscription.store';
import { PlanSwitchNotice } from './subscription/presentation/components/plan-switch-notice/plan-switch-notice';
import { subscriptionRoutes } from './subscription/presentation/subscription.routes';
import { trackingRoutes } from './tracking/presentation/tracking.routes';

/** Every route of a tree that opens a page, with the path that leads to it. */
const pagesOf = (tree: Routes, parent = ''): { path: string; title: unknown }[] =>
  tree.flatMap((route) => {
    const path = `${parent}/${route.path ?? ''}`;
    const page = route.component || route.loadComponent ? [{ path, title: route.title }] : [];
    return [...page, ...pagesOf(route.children ?? [], path)];
  });

const pages = [routes, iamRoutes, laboratoryRoutes, equipmentRoutes, batchRoutes, inventoryRoutes, caRoutes, trackingRoutes, raRoutes, subscriptionRoutes, profileRoutes]
  .flatMap((tree) => pagesOf(tree));

const textOf = (translations: unknown, key: string): unknown =>
  key.split('.').reduce<unknown>((value, part) => (value as Record<string, unknown> | undefined)?.[part], translations);

describe('Composition of the bounded contexts', () => {
  const selectPlan = vi.fn();
  const isSignedIn = signal(false);
  const routeOf = (path: string) => routes.find((route) => route.path === path)!;

  async function open(url: string) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([routeOf('iam'), { path: 'dashboard', children: [] }]),
        { provide: SubscriptionStore, useValue: { selectPlan } },
        { provide: IamStore, useValue: { isSignedIn } },
      ],
    });
    const router = TestBed.inject(Router);
    await router.navigateByUrl(url);
    return router.url;
  }

  beforeEach(() => selectPlan.mockClear());

  it('keeps the plan of the link even when the visitor is already signed in and is sent to the dashboard', async () => {
    isSignedIn.set(true);
    expect(await open('/iam/sign-up?plan=ENTERPRISE&billingCycle=YEARLY')).toBe('/dashboard');
    expect(selectPlan).toHaveBeenCalledWith({ planCode: 'ENTERPRISE', billingCycle: 'YEARLY' });
  });

  it('keeps the plan of the link for a visitor who stays on the sign-up page', async () => {
    isSignedIn.set(false);
    expect(await open('/iam/sign-up?plan=BASIC&billingCycle=MONTHLY')).toBe('/iam/sign-up?plan=BASIC&billingCycle=MONTHLY');
    expect(selectPlan).toHaveBeenCalledWith({ planCode: 'BASIC', billingCycle: 'MONTHLY' });
  });

  it('keeps the plan of a link followed from another page of IAM', async () => {
    isSignedIn.set(false);
    await open('/iam/sign-in');
    expect(selectPlan).not.toHaveBeenCalled();
    await TestBed.inject(Router).navigateByUrl('/iam/sign-up?plan=BASIC&billingCycle=MONTHLY');
    expect(selectPlan).toHaveBeenCalledWith({ planCode: 'BASIC', billingCycle: 'MONTHLY' });
  });

  it('hands the plan switch notice to the dashboard', async () => {
    const notice = routeOf('dashboard').resolve?.['noticeComponent'] as () => Promise<unknown>;
    expect(await notice()).toBe(PlanSwitchNotice);
  });
});

describe('Titles of the pages', () => {
  it('gives every page a title', () => {
    expect(pages.length).toBeGreaterThan(50);
    expect(pages.filter((page) => !page.title).map((page) => page.path)).toEqual([]);
  });

  it.each([
    { language: 'English', translations: english },
    { language: 'Spanish', translations: spanish },
  ])('translates the title of every page to $language', ({ translations }) => {
    const missing = pages.filter((page) => typeof textOf(translations, String(page.title)) !== 'string');
    expect(missing.map((page) => `${page.path}: ${String(page.title)}`)).toEqual([]);
  });

  it('keeps every title in the translations of the page titles', () => {
    expect(pages.filter((page) => !String(page.title).startsWith('page-titles.')).map((page) => page.path)).toEqual([]);
  });
});
