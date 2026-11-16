import { Routes } from '@angular/router';
import { operatorGuard } from '../../iam/infrastructure/role-guards';

/**
 * Lazy loads the equipment list view component.
 *
 * @remarks
 * This function enables route-level lazy loading, reducing the initial bundle
 * size by loading the equipment list view only when the route is accessed.
 *
 * @returns A Promise that resolves to the EquipmentList component.
 */
const equipmentList = () =>
  import('./views/equipment-list/equipment-list').then((m) => m.EquipmentList);

/**
 * Lazy loads the equipment registration form view component.
 *
 * @remarks
 * This function loads the equipment form only when the user navigates to the
 * equipment registration route.
 *
 * @returns A Promise that resolves to the EquipmentForm component.
 */
const equipmentForm = () =>
  import('./views/equipment-form/equipment-form').then((m) => m.EquipmentForm);

/**
 * Lazy loads the equipment detail view component.
 *
 * @remarks
 * This function loads the equipment detail view when the user accesses a route
 * containing a specific equipment identifier.
 *
 * @returns A Promise that resolves to the EquipmentDetail component.
 */
const equipmentDetail = () =>
  import('./views/equipment-detail/equipment-detail').then((m) => m.EquipmentDetail);

/**
 * Lazy loads the BPM configuration form view component.
 *
 * @remarks
 * This function loads the BPM configuration form when the user navigates to
 * the route used to configure parameters for a specific equipment.
 *
 * @returns A Promise that resolves to the BpmConfigForm component.
 */
const bpmConfigForm = () =>
  import('./views/bpm-config-form/bpm-config-form').then((m) => m.BpmConfigForm);

/**
 * Lazy loads the IoT device registration form view component.
 *
 * @remarks
 * This function loads the form used to register IoT devices (environmental devices
 * and container monitors) only when the user navigates to the device registration route.
 *
 * @returns A Promise that resolves to the DeviceForm component.
 */
const deviceForm = () =>
  import('./views/device-form/device-form').then((m) => m.DeviceForm);

/**
 * Lazy loads the Edge Gateway registration form view component.
 *
 * @remarks
 * This function loads the form used to register an Edge Gateway only when the user
 * navigates to the Edge Gateway registration route.
 *
 * @returns A Promise that resolves to the EdgeGatewayForm component.
 */
const edgeGatewayForm = () =>
  import('./views/edge-gateway-form/edge-gateway-form').then((m) => m.EdgeGatewayForm);

/**
 * Lazy loads the view of what is located in an environment.
 *
 * @remarks
 * This function loads the view that shows the Edge Gateways, IoT devices and equipment of an
 * environment when the user accesses a route containing a specific environment identifier.
 *
 * @returns A Promise that resolves to the EnvironmentEquipment component.
 */
const environmentEquipment = () =>
  import('./views/environment-equipment/environment-equipment').then((m) => m.EnvironmentEquipment);

/**
 * Lazy loads the maintenance registration form view component.
 *
 * @remarks
 * This function loads the maintenance form when the user navigates to the route
 * used to register a maintenance activity for a specific equipment.
 *
 * @returns A Promise that resolves to the MaintenanceForm component.
 */
const maintenanceForm = () =>
  import('./views/maintenance-form/maintenance-form').then((m) => m.MaintenanceForm);

/**
 * Defines the routing configuration for the Equipment bounded context.
 *
 * @remarks
 * This route configuration groups all equipment-related views. Each route uses Angular
 * lazy loading through loadComponent, allowing the application to load each view only when needed.
 *
 * Child routes name the resource, not the view that renders it:
 * - empty path: list of the equipment, IoT devices and Edge Gateways; `?environmentId=` opens it filtered by environment.
 * - `new`: equipment registration form.
 * - `devices/new`: IoT device registration form.
 * - `edge-gateways/new`: Edge Gateway registration form.
 * - `environments/:environmentId`: what is located in an environment and how its Edge Gateways cover its IoT devices.
 * - `:equipmentId`: detail of an equipment; it also shows its maintenance history.
 * - `:equipmentId/bpm-configuration`: BPM parameter configuration; protected by `operatorGuard`.
 * - `:equipmentId/maintenances/new`: maintenance registration form; protected by `operatorGuard`.
 *
 * Static segments are declared before `:equipmentId` so that `new`, `devices`, `edge-gateways` and
 * `environments` are not read as identifiers.
 * The view-named paths used before semantic routes redirect to their new address, so bookmarks keep working.
 */
const equipmentRoutes: Routes = [
  { path: '', loadComponent: equipmentList, pathMatch: 'full', title: 'page-titles.equipment-list' },
  { path: 'new', loadComponent: equipmentForm, title: 'page-titles.equipment-new' },
  { path: 'devices/new', loadComponent: deviceForm, title: 'page-titles.device-new' },
  { path: 'edge-gateways/new', loadComponent: edgeGatewayForm, title: 'page-titles.edge-gateway-new' },
  { path: 'environments/:environmentId', loadComponent: environmentEquipment, title: 'page-titles.environment-equipment' },
  // View-named paths used before semantic routes, declared before the identifier so they are not read as one.
  { path: 'equipment-list', redirectTo: '/equipments', pathMatch: 'full' },
  { path: 'register-equipment', redirectTo: '/equipments/new', pathMatch: 'full' },
  { path: 'register-device', redirectTo: '/equipments/devices/new', pathMatch: 'full' },
  { path: 'equipment-detail/:id', redirectTo: '/equipments/:id' },
  { path: 'maintenance-history/:id', redirectTo: '/equipments/:id' },
  { path: 'bpm-config-form/:id', redirectTo: '/equipments/:id/bpm-configuration' },
  { path: 'maintenance-form/:id', redirectTo: '/equipments/:id/maintenances/new' },
  { path: ':equipmentId', loadComponent: equipmentDetail, title: 'page-titles.equipment-detail' },
  { path: ':equipmentId/bpm-configuration', loadComponent: bpmConfigForm, canActivate: [operatorGuard], title: 'page-titles.bpm-config' },
  { path: ':equipmentId/maintenances/new', loadComponent: maintenanceForm, canActivate: [operatorGuard], title: 'page-titles.maintenance-new' },
];

export { equipmentRoutes };
