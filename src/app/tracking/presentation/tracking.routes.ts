import { Routes } from '@angular/router';

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
  { path: 'monitoring', loadComponent: environmentalMonitoring, title: 'page-titles.monitoring' },
  { path: 'history', loadComponent: telemetryHistory, title: 'page-titles.telemetry-history' },
  { path: 'profiles', loadComponent: environmentalProfiles, title: 'page-titles.environmental-profiles' },
  // The analysis chart is part of the history of each device.
  { path: 'analysis', redirectTo: 'history', pathMatch: 'full' },
  // View-named path used before semantic routes.
  { path: 'dashboard', redirectTo: 'monitoring', pathMatch: 'full' },
  { path: '', redirectTo: 'monitoring', pathMatch: 'full' },
];

export { trackingRoutes };
