import { Routes } from '@angular/router';
import { Home } from './shared/presentation/views/home/home';
import { iamGuard, visitorGuard } from './iam/infrastructure/iam-guard';
import { onboardingGuard } from './iam/infrastructure/onboarding-guard';
import { qualityManagerGuard } from './iam/infrastructure/role-guards';
import { AuthenticationSection } from './iam/presentation/components/authentication-section/authentication-section';

const about = () => import('./shared/presentation/views/about/about').then((m) => m.About);

const dashboard = () =>
  import('./ra/presentation/views/dashboard/dashboard').then((m) => m.Dashboard);

const pageNotFound = () =>
  import('./shared/presentation/views/page-not-found/page-not-found').then((m) => m.PageNotFound);

const laboratoryRoutes = () =>
  import('./laboratory/presentation/laboratory.routes').then((m) => m.laboratoryRoutes);

// IAM cannot import subscription, so its routes get the guard of the plan of a website link here. A child guard runs
// before the guards of the page: someone already signed in is sent away by visitorGuard, and the plan must be kept before that.
const iamRoutes = async (): Promise<Routes> => {
  const [{ iamRoutes: children }, { planPreselectionGuard }] = await Promise.all([
    import('./iam/presentation/iam.routes'),
    import('./subscription/infrastructure/plan-preselection-guard'),
  ]);
  return [{ path: '', canActivateChild: [planPreselectionGuard], children }];
};

const planSwitchNotice = () =>
  import('./subscription/presentation/components/plan-switch-notice/plan-switch-notice').then((m) => m.PlanSwitchNotice);

const equipmentRoutes = () =>
  import('./equipment/presentation/equipment.routes').then((m) => m.equipmentRoutes);

const batchRoutes = () => import('./batch/presentation/batch.routes').then((m) => m.batchRoutes);

const caRoutes = () => import('./ca/presentation/ca.routes').then((m) => m.caRoutes);

const raRoutes = () => import('./ra/presentation/ra.routes').then((m) => m.raRoutes);

const trackingRoutes = () =>
  import('./tracking/presentation/tracking.routes').then((m) => m.trackingRoutes);

const profileRoutes = () =>
  import('./profile/presentation/profile.routes').then((m) => m.profileRoutes);

const subscriptionRoutes = () =>
  import('./subscription/presentation/subscription.routes').then((m) => m.subscriptionRoutes);


export const routes: Routes = [
  // Home is in shared and cannot import IAM: the route hands it the authentication section to render.
  { path: 'home', component: Home, canActivate: [visitorGuard], data: { authComponent: AuthenticationSection }, title: 'page-titles.home' },
  { path: 'about', loadComponent: about, title: 'page-titles.about' },

  // The Layout wraps every page from app.html, so no route declares it.
  // The dashboard is in ra and cannot import subscription: the route hands it the notice to render.
  { path: 'dashboard', loadComponent: dashboard, canActivate: [onboardingGuard], resolve: { noticeComponent: planSwitchNotice }, title: 'page-titles.dashboard' },
  { path: 'iam', loadChildren: iamRoutes },
  { path: 'inventory', loadChildren: () => import('./inventory/presentation/inventory.routes').then(m => m.inventoryRoutes), canActivate: [onboardingGuard], canActivateChild: [onboardingGuard] },
  { path: 'laboratories', loadChildren: laboratoryRoutes, canActivate: [iamGuard] },
  { path: 'equipments', loadChildren: equipmentRoutes, canActivate: [onboardingGuard], canActivateChild: [onboardingGuard] },
  { path: 'batches', loadChildren: batchRoutes, canActivate: [onboardingGuard], canActivateChild: [onboardingGuard] },
  { path: 'alerts', loadChildren: caRoutes, canActivate: [onboardingGuard], canActivateChild: [onboardingGuard] },
  { path: 'reports', loadChildren: raRoutes, canActivate: [onboardingGuard], canActivateChild: [onboardingGuard] },
  { path: 'tracking', loadChildren: trackingRoutes, canActivate: [onboardingGuard], canActivateChild: [onboardingGuard] },
  { path: 'subscriptions', loadChildren: subscriptionRoutes, canActivate: [iamGuard, qualityManagerGuard] },
  { path: 'profile', loadChildren: profileRoutes, canActivate: [onboardingGuard], canActivateChild: [onboardingGuard] },

  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', loadComponent: pageNotFound, title: 'page-titles.not-found' },
];
