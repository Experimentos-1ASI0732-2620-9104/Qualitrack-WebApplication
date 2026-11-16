import { Routes } from '@angular/router';
import { laboratorySetupGuard, onboardingGuard } from '../../iam/infrastructure/onboarding-guard';
import { qualityManagerGuard, staffActivityGuard } from '../../iam/infrastructure/role-guards';

/**
 * Lazily loads the laboratory profile view.
 */
const labProfile = () => import('./views/lab-profile/lab-profile').then((m) => m.LabProfile);

/**
 * Lazily loads the laboratory registration view.
 */
const labForm = () => import('./views/lab-form/lab-form').then((m) => m.LabForm);

/**
 * Lazily loads the environment list view.
 */
const environmentList = () =>
  import('./views/environment-list/environment-list').then((m) => m.EnvironmentList);
/**
 * Lazily loads the environment registration and edition view.
 */
const environmentForm = () =>
  import('./views/environment-form/environment-form').then((m) => m.EnvironmentForm);

/**
 * Lazily loads the staff list view.
 */
const staffList = () => import('./views/staff-list/staff-list').then((m) => m.StaffList);

/**
 * Lazily loads the staff registration view.
 */
const staffForm = () => import('./views/staff-form/staff-form').then((m) => m.StaffForm);

/**
 * Lazily loads the staff member detail view.
 */
const staffDetail = () => import('./views/staff-detail/staff-detail').then((m) => m.StaffDetail);

/**
 * Routes of the Laboratory bounded context.
 *
 * @remarks
 * `new` registers the laboratory of a user that has none yet. The other routes require a
 * completed onboarding and are addressed by resource:
 * `profile`, `environments[/new|/:environmentId/edit]` and `staff[/new|/:staffId]`. The view-named paths
 * used before semantic routes redirect to their new address. Legacy product and
 * raw material routes redirect to Product Batch Management and Inventory Management,
 * which now own those resources.
 */
export const laboratoryRoutes: Routes = [
  { path: 'new', loadComponent: labForm, canActivate: [laboratorySetupGuard], title: 'page-titles.lab-new' },
  { path: 'create', redirectTo: 'new', pathMatch: 'full' },
  { path: 'lab-form', redirectTo: 'new', pathMatch: 'full' },
  {
    path: '',
    canActivate: [onboardingGuard],
    canActivateChild: [onboardingGuard],
    children: [
      { path: 'profile', loadComponent: labProfile, title: 'page-titles.lab-profile' },
      { path: 'environments', loadComponent: environmentList, title: 'page-titles.environment-list' },
      { path: 'environments/new', loadComponent: environmentForm, title: 'page-titles.environment-new' },
      { path: 'environments/:environmentId/edit', loadComponent: environmentForm, title: 'page-titles.environment-edit' },
      { path: 'staff', loadComponent: staffList, title: 'page-titles.staff-list' },
      { path: 'staff/new', loadComponent: staffForm, canActivate: [qualityManagerGuard], title: 'page-titles.staff-new' },
      { path: 'staff/:staffId', loadComponent: staffDetail, canActivate: [staffActivityGuard], title: 'page-titles.staff-detail' },
      // View-named paths used before semantic routes.
      { path: 'lab-profile', redirectTo: 'profile', pathMatch: 'full' },
      { path: 'staff-list', redirectTo: 'staff', pathMatch: 'full' },
      { path: 'staff-form', redirectTo: 'staff/new', pathMatch: 'full' },
      // Products belong to Product Batch Management and are registered per environment.
      { path: 'product-catalog', redirectTo: '/batches/environments', pathMatch: 'full' },
      { path: 'product-form', redirectTo: '/batches/environments', pathMatch: 'full' },
      { path: 'raw-material-list', redirectTo: '/inventory', pathMatch: 'full' },
      { path: 'raw-material-form', redirectTo: '/inventory', pathMatch: 'full' },
      { path: 'raw-materials/:id', redirectTo: '/inventory/legacy-materials/:id', pathMatch: 'full' },
      { path: '', redirectTo: 'profile', pathMatch: 'full' },
    ],
  },
];
