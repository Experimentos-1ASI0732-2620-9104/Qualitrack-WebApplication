import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, Routes } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { batchRoutes } from './batch/presentation/batch.routes';
import { caRoutes } from './ca/presentation/ca.routes';
import { equipmentRoutes } from './equipment/presentation/equipment.routes';
import { laboratoryRoutes } from './laboratory/presentation/laboratory.routes';
import { raRoutes } from './ra/presentation/ra.routes';
import { subscriptionRoutes } from './subscription/presentation/subscription.routes';
import { trackingRoutes } from './tracking/presentation/tracking.routes';

@Component({ template: '' })
class Destination {}

/**
 * A route tree of a bounded context with its real paths and order, where every view is a plain destination and the
 * Layout and guards are left out, so only the URLs are tested.
 *
 * @remarks
 * A view with child routes keeps its path in front of theirs, and is a destination of its own.
 */
const urlsOf = (routes: Routes, parent = ''): Routes =>
  routes.flatMap((route) => {
    const path = [parent, route.path].filter(Boolean).join('/');
    if (route.children) {
      const view: Routes =
        route.loadComponent || route.component
          ? [{ path, pathMatch: 'full', component: Destination }]
          : [];
      return [...urlsOf(route.children, path), ...view];
    }
    return [
      route.redirectTo === undefined
        ? { path, pathMatch: route.pathMatch, component: Destination }
        : { path, pathMatch: route.pathMatch, redirectTo: route.redirectTo },
    ];
  });


describe('Semantic routes', () => {
  beforeEach(() => {
    const tree = (path: string, routes: Routes): Routes => [{ path, children: urlsOf(routes) }];
    TestBed.configureTestingModule({
      providers: [provideRouter([
        ...tree('equipments', equipmentRoutes), ...tree('alerts', caRoutes), ...tree('reports', raRoutes),
        ...tree('laboratories', laboratoryRoutes), ...tree('batches', batchRoutes),
        ...tree('tracking', trackingRoutes), ...tree('subscriptions', subscriptionRoutes),
      ])],
    });
  });

  const legacy: [string, string][] = [
    ['/equipments/equipment-list', '/equipments'],
    ['/equipments/register-equipment', '/equipments/new'],
    ['/equipments/register-device', '/equipments/devices/new'],
    ['/equipments/equipment-detail/4', '/equipments/4'],
    ['/equipments/maintenance-history/4', '/equipments/4'],
    ['/equipments/bpm-config-form/4', '/equipments/4/bpm-configuration'],
    ['/equipments/maintenance-form/4', '/equipments/4/maintenances/new'],
    ['/alerts/alert-dashboard', '/alerts'],
    ['/alerts/alert-history', '/alerts/history'],
    ['/alerts/deviation-detail/42', '/alerts/42'],
    ['/reports/kpi-dashboard', '/reports/kpis'],
    ['/reports/report-generator', '/reports/new'],
    ['/reports/staff-activity/2', '/reports/staff/2/activity'],
    ['/laboratories/create', '/laboratories/new'],
    ['/laboratories/lab-profile', '/laboratories/profile'],
    ['/laboratories/staff-list', '/laboratories/staff'],
    ['/laboratories/staff-form', '/laboratories/staff/new'],
    ['/batches/batch-list', '/batches'],
    ['/batches/batch-detail/7', '/batches/7'],
    ['/tracking/dashboard', '/tracking/monitoring'],
    ['/subscriptions/billing-summary', '/subscriptions/billing'],
  ];

  for (const [from, to] of legacy) {
    it(`redirects the view-named ${from} to ${to}`, async () => {
      await RouterTestingHarness.create(from);
      expect(TestBed.inject(Router).url).toBe(to);
    });
  }
});
