import { Routes } from '@angular/router';

/** Lazy loader of the view of the active alerts. */
const alertDashboard = () =>
  import('./views/alert-dashboard/alert-dashboard').then((m) => m.AlertDashboard);

/** Lazy loader of the view of the alert history. */
const alertHistory = () =>
  import('./views/alert-history/alert-history').then((m) => m.AlertHistory);

/** Lazy loader of the detail of a deviation alert, which opens over the active alerts. */
const alertDetailPanel = () =>
  import('./views/alert-detail-panel/alert-detail-panel').then((m) => m.AlertDetailPanel);

const notificationSettings = () =>
  import('./views/notification-settings/notification-settings').then((m) => m.NotificationSettings);

/**
 * Route tree of Compliance & Alerting (CA).
 *
 * @remarks
 * All the views load lazily and are addressed by resource:
 * - empty path: active alerts of an environment (US85).
 * - `history`: every alert of one environment or of the whole laboratory, filtered in the browser (TS74).
 * - `history/:alertId`: detail of an alert in a panel over the history, which keeps its filter.
 * - `notification-settings`: notification preferences of the signed-in user.
 * - `:alertId`: detail of the deviation alert with that numeric id, in a panel over the active alerts (US86).
 *
 * The view-named paths used before semantic routes redirect to their new address; e-mails sent by the
 * platform still link to `deviation-detail/:id`.
 */
const caRoutes: Routes = [
  {
    path: 'history',
    loadComponent: alertHistory,
    title: 'page-titles.alert-history',
    children: [{ path: ':alertId', loadComponent: alertDetailPanel, title: 'page-titles.alert-detail' }],
  },
  {
    path: 'notification-settings',
    loadComponent: notificationSettings,
    title: 'page-titles.notification-preferences',
  },
  // View-named paths used before semantic routes, declared before the identifier so they are not read as one.
  { path: 'alert-dashboard', redirectTo: '/alerts', pathMatch: 'full' },
  { path: 'alert-history', redirectTo: '/alerts/history', pathMatch: 'full' },
  { path: 'deviation-detail/:id', redirectTo: '/alerts/:id' },
  // Declared last because its empty path would read every other address as the identifier of an alert.
  {
    path: '',
    loadComponent: alertDashboard,
    title: 'page-titles.alerts',
    children: [{ path: ':alertId', loadComponent: alertDetailPanel, title: 'page-titles.alert-detail' }],
  },
];

export { caRoutes };
