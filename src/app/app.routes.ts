import { Routes } from '@angular/router';
import { Home } from './shared/presentation/views/home/home';
import { Layout } from './shared/presentation/components/layout/layout';
import { iamGuard } from './iam/infrastructure/iam-guard';
import { onboardingGuard } from './iam/infrastructure/onboarding-guard';

const about = () => import('./shared/presentation/views/about/about').then((m) => m.About);

const dashboard = () =>
  import('./shared/presentation/views/dashboard/dashboard').then((m) => m.Dashboard);

const pageNotFound = () =>
  import('./shared/presentation/views/page-not-found/page-not-found').then((m) => m.PageNotFound);

const laboratoryRoutes = () =>
  import('./laboratory/presentation/laboratory-routes').then((m) => m.laboratoryRoutes);

const iamRoutes = () => import('./iam/presentation/iam.routes').then((m) => m.iamRoutes);

const equipmentRoutes = () =>
  import('./equipment/presentation/equipment-routes').then((m) => m.equipmentRoutes);

const batchRoutes = () => import('./batch/presentation/batch-routes').then((m) => m.batchRoutes);

const caRoutes = () => import('./ca/presentation/ca-routes').then((m) => m.caRoutes);

const raRoutes = () => import('./ra/presentation/ra-routes').then((m) => m.raRoutes);

const trackingRoutes = () =>
  import('./tracking/presentation/tracking-routes').then((m) => m.trackingRoutes);

const subscriptionRoutes = () =>
  import('./subscription/presentation/subscription-routes').then((m) => m.subscriptionRoutes);

const baseTitle = 'QualiTrack';

export const routes: Routes = [
  { path: 'home', component: Home, title: `Home - ${baseTitle}` },
  { path: 'about', loadComponent: about, title: `About - ${baseTitle}` },
  {
    path: 'dashboard',
    component: Layout,
    canActivate: [onboardingGuard],
    children: [{ path: '', loadComponent: dashboard, title: `Dashboard - ${baseTitle}` }],
  },
  { path: 'iam', loadChildren: iamRoutes },
  { path: 'inventory', loadChildren: () => import('./inventory/presentation/inventory-routes').then(m => m.inventoryRoutes), canActivate: [onboardingGuard], canActivateChild: [onboardingGuard] },
  { path: 'laboratories', loadChildren: laboratoryRoutes, canActivate: [iamGuard] },
  { path: 'equipments', loadChildren: equipmentRoutes, canActivate: [onboardingGuard], canActivateChild: [onboardingGuard] },
  { path: 'batches', loadChildren: batchRoutes, canActivate: [onboardingGuard], canActivateChild: [onboardingGuard] },
  { path: 'alerts', loadChildren: caRoutes, canActivate: [onboardingGuard], canActivateChild: [onboardingGuard] },
  { path: 'reports', loadChildren: raRoutes, canActivate: [onboardingGuard], canActivateChild: [onboardingGuard] },
  { path: 'tracking', loadChildren: trackingRoutes, canActivate: [onboardingGuard], canActivateChild: [onboardingGuard] },
  { path: 'subscriptions', loadChildren: subscriptionRoutes, canActivate: [iamGuard] },

  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: '**', loadComponent: pageNotFound, title: `Page Not Found - ${baseTitle}` },
];
