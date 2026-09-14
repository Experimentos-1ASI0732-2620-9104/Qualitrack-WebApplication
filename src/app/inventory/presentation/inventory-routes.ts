import { Routes } from '@angular/router';
import { Layout } from '../../shared/presentation/components/layout/layout';

const inventoryCatalogue = () =>
  import('./views/inventory-catalogue/inventory-catalogue').then((m) => m.InventoryCatalogue);

const inventoryDetail = () =>
  import('./views/inventory-detail/inventory-detail').then((m) => m.InventoryDetail);

const registerMaterial = () =>
  import('./views/register-material/register-material').then((m) => m.RegisterMaterial);

const inventoryRoutes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      { path: 'inventory-catalogue', loadComponent: inventoryCatalogue },
      { path: 'register-material', loadComponent: registerMaterial },
      { path: 'inventory-detail/:id', loadComponent: inventoryDetail },
      // Preserve links created before the route naming was aligned.
      { path: 'materials/:id', redirectTo: 'inventory-detail/:id', pathMatch: 'full' },
      { path: '', redirectTo: 'inventory-catalogue', pathMatch: 'full' },
    ],
  },
];

export { inventoryRoutes };
