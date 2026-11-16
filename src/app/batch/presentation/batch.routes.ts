import { Routes } from '@angular/router';
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
 * `/batches` lists every batch of the laboratory and `/batches/environments` opens the production environment
 * whose products are shown. Products and batches are addressed inside an environment, mirroring
 * /api/v1/laboratories/{laboratoryId}/environments/{environmentId}/products/{productId}/batches.
 * Links that only know the batch id (`/batches/:batchId`) resolve the full path. The view-named paths used
 * before semantic routes redirect to their new address.
 *
 * Registering a batch is guarded by the operator guard; releasing and rejecting are restricted to quality
 * managers inside their own views.
 *
 * @author Qualitrack
 */
export const batchRoutes: Routes = [
  { path: '', loadComponent: batchList, pathMatch: 'full', title: 'page-titles.batch-list' },
  { path: 'environments', loadComponent: batchHome, pathMatch: 'full', title: 'page-titles.product-catalog' },
  { path: 'environments/:environmentId/products', loadComponent: productCatalog, title: 'page-titles.product-catalog' },
  { path: 'environments/:environmentId/products/new', loadComponent: productForm, title: 'page-titles.product-new' },
  { path: product, loadComponent: productDetail, title: 'page-titles.product-detail' },
  { path: `${product}/batches/new`, loadComponent: batchForm, canActivate: [operatorGuard], title: 'page-titles.batch-new' },
  { path: batch, loadComponent: batchDetail, title: 'page-titles.batch-detail' },
  { path: `${batch}/release`, loadComponent: batchReleaseForm, title: 'page-titles.batch-release' },
  { path: `${batch}/reject`, loadComponent: batchRejectForm, title: 'page-titles.batch-reject' },
  // View-named paths used before semantic routes.
  { path: 'batch-list', redirectTo: '/batches', pathMatch: 'full' },
  { path: 'batch-form', redirectTo: '/batches/environments', pathMatch: 'full' },
  { path: 'batch-detail/:id', redirectTo: '/batches/:id' },
  { path: 'batch-release-form/:id', redirectTo: '/batches/:id' },
  { path: 'batch-reject-form/:id', redirectTo: '/batches/:id' },
  // Links that only know the batch id (dashboard, inventory, reports) are resolved to the full path.
  { path: ':batchId', loadComponent: batchRedirect, title: 'page-titles.batch-detail' },
];
