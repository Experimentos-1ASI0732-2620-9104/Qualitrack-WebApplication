import { Routes } from '@angular/router';
import { Layout } from '../../shared/presentation/components/layout/layout';

/** Lazy loader of the view of the active alerts. */
const alertDashboard = () =>
  import('./views/alert-dashboard/alert-dashboard').then((m) => m.AlertDashboard);

/** Lazy loader of the view of the alert history. */
const alertHistory = () =>
  import('./views/alert-history/alert-history').then((m) => m.AlertHistory);

/** Lazy loader of the detail of a deviation alert. */
const deviationDetail = () =>
  import('./views/deviation-detail/deviation-detail').then((m) => m.DeviationDetail);

/**
 * Route tree of Compliance & Alerting (CA).
 *
 * @remarks
 * All the views are children of the shared {@link Layout} and load lazily:
 * - `alert-dashboard`: active alerts of an environment (US85).
 * - `alert-history`: every alert of an environment, filtered by status and severity (TS74).
 * - `deviation-detail/:id`: detail of the deviation alert with that numeric id (US86).
 * - `notification-settings`: redirects to `/profile`, where the notification preferences are edited.
 * - empty path: redirects to `alert-dashboard`.
 */
const caRoutes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: 'alert-dashboard', loadComponent: alertDashboard },
      { path: 'alert-history', loadComponent: alertHistory },
      { path: 'deviation-detail/:id', loadComponent: deviationDetail },
      // Notification preferences are edited in the profile.
      { path: 'notification-settings', redirectTo: '/profile', pathMatch: 'full' },
      { path: '', redirectTo: 'alert-dashboard', pathMatch: 'full' },
    ],
  },
];

export { caRoutes };
