import { Routes } from '@angular/router';
import { Layout } from '../../shared/presentation/components/layout/layout';
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
 * `create` registers the laboratory of a user that has none yet. The other routes are
 * rendered inside the application layout once onboarding is complete. Legacy product and
 * raw material routes redirect to Product Batch Management and Inventory Management,
 * which now own those resources.
 */
export const laboratoryRoutes: Routes = [
  { path: 'create', loadComponent: labForm, canActivate: [laboratorySetupGuard] },
  { path: 'lab-form', redirectTo: 'create', pathMatch: 'full' },
  {
    path: '',
    component: Layout,
    canActivate: [onboardingGuard],
    canActivateChild: [onboardingGuard],
    children: [
      { path: 'lab-profile', loadComponent: labProfile },
      { path: 'environments', loadComponent: environmentList },
      { path: 'environments/new', loadComponent: environmentForm },
      { path: 'environments/:environmentId/edit', loadComponent: environmentForm },
      { path: 'staff-list', loadComponent: staffList },
      { path: 'staff-form', loadComponent: staffForm, canActivate: [qualityManagerGuard] },
      { path: 'staff/:staffId', loadComponent: staffDetail, canActivate: [staffActivityGuard] },
      // Products belong to Product Batch Management and are registered per environment.
      { path: 'product-catalog', redirectTo: '/batches', pathMatch: 'full' },
      { path: 'product-form', redirectTo: '/batches', pathMatch: 'full' },
      { path: 'raw-material-list', redirectTo: '/inventory', pathMatch: 'full' },
      { path: 'raw-material-form', redirectTo: '/inventory', pathMatch: 'full' },
      { path: 'raw-materials/:id', loadComponent: () => import('./views/raw-material-detail/raw-material-detail').then(m => m.RawMaterialDetail) },
      { path: '', redirectTo: 'lab-profile', pathMatch: 'full' },
    ],
  },
];
