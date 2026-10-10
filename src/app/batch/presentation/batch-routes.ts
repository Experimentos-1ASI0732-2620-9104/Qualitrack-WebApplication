import { Routes } from '@angular/router';
import { Layout } from '../../shared/presentation/components/layout/layout';
import { operatorGuard } from '../../iam/infrastructure/role-guards';

// Lazy loaders of the views of the bounded context.
const batchHome = () =>
  import('./views/batch-home/batch-home').then((m) => m.BatchHome);
const productCatalog = () =>
  import('./views/product-catalog/product-catalog').then((m) => m.ProductCatalog);
const productForm = () =>
  import('./views/product-form/product-form').then((m) => m.ProductForm);
const productDetail = () =>
  import('./views/product-detail/product-detail').then((m) => m.ProductDetail);
const batchList = () =>
  import('./views/batch-list/batch-list').then((m) => m.BatchList);
const batchForm = () =>
  import('./views/batch-form/batch-form').then((m) => m.BatchForm);
const batchDetail = () =>
  import('./views/batch-detail/batch-detail').then((m) => m.BatchDetail);
const batchReleaseForm = () =>
  import('./views/batch-release-form/batch-release-form').then((m) => m.BatchReleaseForm);
const batchRejectForm = () =>
  import('./views/batch-reject-form/batch-reject-form').then((m) => m.BatchRejectForm);
const batchRedirect = () =>
  import('./views/batch-redirect/batch-redirect').then((m) => m.BatchRedirect);

/** Route segment of a product inside its environment. */
const product = 'environments/:environmentId/products/:productId';

/** Route segment of a batch inside its product. */
const batch = `${product}/batches/:batchId`;

/**
 * Routing of Product Batch Management.
 *
 * @remarks
 * Products and batches are addressed inside an environment, mirroring
 * /api/v1/laboratories/{laboratoryId}/environments/{environmentId}/products/{productId}/batches.
 * The laboratory-wide list and the batch-detail/:id link used by other modules resolve the full path.
 *
 * Registering a batch is guarded by the operator guard; releasing and rejecting are restricted to quality
 * managers inside their own views.
 *
 * @author Qualitrack
 */
export const batchRoutes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: '', loadComponent: batchHome, pathMatch: 'full' },
      { path: 'batch-list', loadComponent: batchList },
      { path: 'environments/:environmentId/products', loadComponent: productCatalog },
      { path: 'environments/:environmentId/products/new', loadComponent: productForm },
      { path: product, loadComponent: productDetail },
      { path: `${product}/batches/new`, loadComponent: batchForm, canActivate: [operatorGuard] },
      { path: batch, loadComponent: batchDetail },
      { path: `${batch}/release`, loadComponent: batchReleaseForm },
      { path: `${batch}/reject`, loadComponent: batchRejectForm },
      // Links that only know the batch id (dashboard, inventory, reports) are resolved to the full path.
      { path: 'batch-detail/:id', loadComponent: batchRedirect },
      { path: 'batch-release-form/:id', redirectTo: 'batch-detail/:id' },
      { path: 'batch-reject-form/:id', redirectTo: 'batch-detail/:id' },
      { path: 'batch-form', redirectTo: '', pathMatch: 'full' },
    ],
  },
];
