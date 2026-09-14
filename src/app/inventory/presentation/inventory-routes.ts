import { Routes } from '@angular/router';
import { Layout } from '../../shared/presentation/components/layout/layout';
export const inventoryRoutes: Routes = [
  {
    path: '',
    component: Layout,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./views/inventory-catalogue/inventory-catalogue').then(
            (m) => m.InventoryCatalogue,
          ),
      },
      {
        path: 'materials/:id',
        loadComponent: () =>
          import('./views/inventory-detail/inventory-detail').then((m) => m.InventoryDetail),
      },
    ],
  },
];
