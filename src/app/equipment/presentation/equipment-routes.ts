import { Routes } from '@angular/router';
import { Layout } from '../../shared/presentation/components/layout/layout';
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
 * This route configuration groups all equipment-related views under the shared
 * Layout component. Each child route uses Angular lazy loading through
 * loadComponent, allowing the application to load each view only when needed.
 *
 * Child routes:
 * - `equipment-list`: list of the equipment and IoT devices.
 * - `register-equipment`: equipment registration form.
 * - `register-device`: IoT device registration form.
 * - `equipment-detail/:id`: detail of an equipment; it also shows its maintenance history.
 * - `bpm-config-form/:id`: BPM parameter configuration form; protected by `operatorGuard`.
 * - `maintenance-history/:id`: redirects to `equipment-detail/:id`, where the history is shown.
 * - `maintenance-form/:id`: maintenance registration form; protected by `operatorGuard`.
 * - empty path: redirects to `equipment-list`.
 *
 * Routes with an `:id` parameter are not meant to be used directly from the
 * sidebar because they require a concrete equipment identifier selected from
 * the equipment catalog.
 *
 * The empty child route redirects users to the equipment list by default.
 */
const equipmentRoutes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: 'equipment-list', loadComponent: equipmentList },
      { path: 'register-equipment', loadComponent: equipmentForm },
      { path: 'register-device', loadComponent: deviceForm },
      { path: 'equipment-detail/:id', loadComponent: equipmentDetail },
      { path: 'bpm-config-form/:id', loadComponent: bpmConfigForm, canActivate: [operatorGuard] },
      // The maintenance history is shown in the equipment detail.
      { path: 'maintenance-history/:id', redirectTo: 'equipment-detail/:id' },
      { path: 'maintenance-form/:id', loadComponent: maintenanceForm, canActivate: [operatorGuard] },
      { path: '', redirectTo: 'equipment-list', pathMatch: 'full' },
    ],
  },
];

export { equipmentRoutes };
