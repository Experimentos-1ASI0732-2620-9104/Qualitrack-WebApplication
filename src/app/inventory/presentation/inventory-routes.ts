import { Routes } from '@angular/router';
import { Layout } from '../../shared/presentation/components/layout/layout';

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
  {
    path: '',
    component: Layout,
    children: [
      { path: '', loadComponent: inventoryHome, pathMatch: 'full' },
      { path: 'environments/:environmentId/raw-materials', loadComponent: inventoryCatalogue },
      { path: 'environments/:environmentId/raw-materials/new', loadComponent: registerMaterial },
      { path: 'environments/:environmentId/raw-materials/:rawMaterialId', loadComponent: inventoryDetail },
      // Links created before raw materials were scoped to environments open the environment picker.
      { path: 'inventory-catalogue', redirectTo: '', pathMatch: 'full' },
      { path: 'register-material', redirectTo: '', pathMatch: 'full' },
      { path: 'inventory-detail/:id', redirectTo: '', pathMatch: 'full' },
      { path: 'materials/:id', redirectTo: '', pathMatch: 'full' },
    ],
  },
];

export { inventoryRoutes };
