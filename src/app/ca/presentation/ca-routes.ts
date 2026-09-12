import { Routes } from '@angular/router';
import { Layout } from '../../shared/presentation/components/layout/layout';

const alertDashboard = () =>
  import('./views/alert-dashboard/alert-dashboard').then((m) => m.AlertDashboard);

const alertHistory = () =>
  import('./views/alert-history/alert-history').then((m) => m.AlertHistory);

const deviationDetail = () =>
  import('./views/deviation-detail/deviation-detail').then((m) => m.DeviationDetail);

const notificationSettings = () =>
  import('./views/notification-settings/notification-settings').then((m) => m.NotificationSettings);

/**
 * Route tree for learning presentation views.
 */
const caRoutes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: 'alert-dashboard', loadComponent: alertDashboard },
      { path: 'alert-history', loadComponent: alertHistory },
      { path: 'deviation-detail/:id', loadComponent: deviationDetail },
      { path: 'notification-settings', loadComponent: notificationSettings },
      { path: '', redirectTo: 'alert-dashboard', pathMatch: 'full' },
    ],
  },
];

export { caRoutes };
