import { Routes } from '@angular/router';
import { Layout } from '../../shared/presentation/components/layout/layout';

const telemetryDashboard = () =>
  import('./views/telemetry-dashboard/telemetry-dashboard').then(
    (m) => m.TelemetryDashboardComponent,
  );

const telemetryChart = () =>
  import('./views/telemetry-chart/telemetry-chart').then((m) => m.TelemetryChartComponent);

const telemetryHistory = () =>
  import('./views/telemetry-history/telemetry-history').then((m) => m.TelemetryHistoryComponent);

const trackingRoutes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: 'dashboard', loadComponent: telemetryDashboard },
      { path: 'analysis', loadComponent: telemetryChart },
      { path: 'history', loadComponent: telemetryHistory },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];

export { trackingRoutes };
