import { Routes } from '@angular/router';
import { Layout } from '../../shared/presentation/components/layout/layout';

const environmentalMonitoring = () =>
  import('./views/environmental-monitoring/environmental-monitoring').then((m) => m.EnvironmentalMonitoring);

const telemetryHistory = () =>
  import('./views/telemetry-history/telemetry-history').then((m) => m.TelemetryHistory);

const environmentalProfiles = () =>
  import('./views/environmental-profiles/environmental-profiles').then((m) => m.EnvironmentalProfiles);

/**
 * Routes of Tracking & Telemetry: current conditions per environment, history of each device and the environmental
 * profiles (thresholds and actuation rules).
 */
const trackingRoutes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: 'dashboard', loadComponent: environmentalMonitoring },
      { path: 'history', loadComponent: telemetryHistory },
      { path: 'profiles', loadComponent: environmentalProfiles },
      // The analysis chart is part of the history of each device.
      { path: 'analysis', redirectTo: 'history', pathMatch: 'full' },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];

export { trackingRoutes };
