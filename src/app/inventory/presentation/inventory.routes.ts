import { Routes } from '@angular/router';

const inventoryHome = () =>
  import('./views/inventory-home/inventory-home').then((m) => m.InventoryHome);

const inventoryCatalogue = () =>
  import('./views/inventory-catalogue/inventory-catalogue').then((m) => m.InventoryCatalogue);

const inventoryDetail = () =>
  import('./views/inventory-detail/inventory-detail').then((m) => m.InventoryDetail);

const registerMaterial = () =>
  import('./views/register-material/register-material').then((m) => m.RegisterMaterial);

/**
 * Raw materials are addressed inside an environment, mirroring
 * /api/v1/laboratories/{laboratoryId}/environments/{environmentId}/raw-materials.
 */
const inventoryRoutes: Routes = [
  { path: 'legacy-materials/:id', loadComponent: () => import('./views/legacy-material-detail/legacy-material-detail').then((m) => m.LegacyMaterialDetail), title: 'page-titles.material-history' },
  { path: '', loadComponent: inventoryHome, pathMatch: 'full', title: 'page-titles.inventory' },
  { path: 'environments/:environmentId/raw-materials', loadComponent: inventoryCatalogue, title: 'page-titles.inventory' },
  { path: 'environments/:environmentId/raw-materials/new', loadComponent: registerMaterial, title: 'page-titles.raw-material-new' },
  { path: 'environments/:environmentId/raw-materials/:rawMaterialId', loadComponent: inventoryDetail, title: 'page-titles.raw-material-detail' },
  // Links created before raw materials were scoped to environments open the environment picker.
  { path: 'inventory-catalogue', redirectTo: '', pathMatch: 'full' },
  { path: 'register-material', redirectTo: '', pathMatch: 'full' },
  { path: 'inventory-detail/:id', redirectTo: '', pathMatch: 'full' },
  { path: 'materials/:id', redirectTo: '', pathMatch: 'full' },
];

export { inventoryRoutes };
