import { Routes } from '@angular/router';
import { Layout } from '../../shared/presentation/components/layout/layout';

const kpiDashboard = () =>
  import('./views/kpi-dashboard/kpi-dashboard').then((m) => m.KpiDashboardComponent);

const deviationTrendChart = () =>
  import('./views/deviation-trend-chart/deviation-trend-chart').then(
    (m) => m.DeviationTrendChartComponent,
  );

const reportGenerator = () =>
  import('./views/report-generator/report-generator').then((m) => m.ReportGeneratorComponent);

const auditLogViewer = () =>
  import('./views/audit-log-viewer/audit-log-viewer').then((m) => m.AuditLogViewerComponent);

const raRoutes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: 'kpi-dashboard', loadComponent: kpiDashboard },
      { path: 'deviation-trends', loadComponent: deviationTrendChart },
      { path: 'report-generator', loadComponent: reportGenerator },
      { path: 'audit-log', loadComponent: auditLogViewer },
      { path: '', redirectTo: 'kpi-dashboard', pathMatch: 'full' },
    ],
  },
];

export { raRoutes };
