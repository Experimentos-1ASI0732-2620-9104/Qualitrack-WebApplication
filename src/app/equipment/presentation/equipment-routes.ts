import { Routes } from '@angular/router';
import { Layout } from '../../shared/presentation/components/layout/layout';

/**
 * Lazy loads the equipment list view component.
 *
 * @returns A Promise that resolves to the EquipmentList component.
 *
 * @remarks
 * This function enables route-level lazy loading, reducing the initial bundle
 * size by loading the equipment list view only when the route is accessed.
 */
const equipmentList = () =>
  import('./views/equipment-list/equipment-list').then((m) => m.EquipmentList);

/**
 * Lazy loads the equipment registration form view component.
 *
 * @returns A Promise that resolves to the EquipmentForm component.
 *
 * @remarks
 * This function loads the equipment form only when the user navigates to the
 * equipment registration route.
 */
const equipmentForm = () =>
  import('./views/equipment-form/equipment-form').then((m) => m.EquipmentForm);

/**
 * Lazy loads the equipment detail view component.
 *
 * @returns A Promise that resolves to the EquipmentDetail component.
 *
 * @remarks
 * This function loads the equipment detail view when the user accesses a route
 * containing a specific equipment identifier.
 */
const equipmentDetail = () =>
  import('./views/equipment-detail/equipment-detail').then((m) => m.EquipmentDetail);

/**
 * Lazy loads the BPM configuration form view component.
 *
 * @returns A Promise that resolves to the BpmConfigForm component.
 *
 * @remarks
 * This function loads the BPM configuration form when the user navigates to
 * the route used to configure parameters for a specific equipment.
 */
const bpmConfigForm = () =>
  import('./views/bpm-config-form/bpm-config-form').then((m) => m.BpmConfigForm);

/**
 * Lazy loads the maintenance history view component.
 *
 * @returns A Promise that resolves to the MaintenanceHistory component.
 *
 * @remarks
 * This function loads the maintenance history view when the user accesses the
 * route associated with the maintenance records of a specific equipment.
 */
const maintenanceHistory = () =>
  import('./views/maintenance-history/maintenance-history').then((m) => m.MaintenanceHistory);

/**
 * Lazy loads the maintenance registration form view component.
 *
 * @returns A Promise that resolves to the MaintenanceForm component.
 *
 * @remarks
 * This function loads the maintenance form when the user navigates to the route
 * used to register a maintenance activity for a specific equipment.
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
      { path: 'equipment-detail/:id', loadComponent: equipmentDetail },
      { path: 'bpm-config-form/:id', loadComponent: bpmConfigForm },
      { path: 'maintenance-history/:id', loadComponent: maintenanceHistory },
      { path: 'maintenance-form/:id', loadComponent: maintenanceForm },
      { path: '', redirectTo: 'equipment-list', pathMatch: 'full' },
    ],
  },
];

export { equipmentRoutes };
