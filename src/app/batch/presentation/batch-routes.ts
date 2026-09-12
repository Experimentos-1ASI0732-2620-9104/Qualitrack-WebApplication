import { Routes } from '@angular/router';
import { Layout } from '../../shared/presentation/components/layout/layout';

/**
 * Lazy loads the batch list view component.
 *
 * @returns A Promise that resolves to the BatchList component
 */
const batchList = () => import('./views/batch-list/batch-list').then((m) => m.BatchList);

/**
 * Lazy loads the batch creation form view component.
 *
 * @returns A Promise that resolves to the BatchForm component
 */
const batchForm = () => import('./views/batch-form/batch-form').then((m) => m.BatchForm);

/**
 * Lazy loads the batch detail view component.
 *
 * @returns A Promise that resolves to the BatchDetail component
 */
const batchDetail = () => import('./views/batch-detail/batch-detail').then((m) => m.BatchDetail);

/**
 * Lazy loads the batch release form view component.
 *
 * @returns A Promise that resolves to the BatchReleaseForm component
 */
const batchReleaseForm = () =>
  import('./views/batch-release-form/batch-release-form').then((m) => m.BatchReleaseForm);

/**
 * Lazy loads the batch rejection form view component.
 *
 * @returns A Promise that resolves to the BatchRejectForm component
 */
const batchRejectForm = () =>
  import('./views/batch-reject-form/batch-reject-form').then((m) => m.BatchRejectForm);

/**
 * Routing configuration for the Batch bounded context.
 *
 * @remarks
 * Groups all batch-related presentation views under the shared application
 * layout. These routes cover batch listing, creation, detail inspection, and
 * lifecycle transitions such as release and rejection.
 */
export const batchRoutes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: 'batch-list', loadComponent: batchList },
      { path: 'batch-form', loadComponent: batchForm },
      { path: 'batch-detail/:id', loadComponent: batchDetail },
      { path: 'batch-release-form/:id', loadComponent: batchReleaseForm },
      { path: 'batch-reject-form/:id', loadComponent: batchRejectForm },
      { path: '', redirectTo: 'batch-list', pathMatch: 'full' },
    ],
  },
];
