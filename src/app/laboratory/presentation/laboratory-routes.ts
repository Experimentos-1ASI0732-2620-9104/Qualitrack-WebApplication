import { Routes } from '@angular/router';
import { Layout } from '../../shared/presentation/components/layout/layout';
import { laboratorySetupGuard, onboardingGuard } from '../../iam/infrastructure/onboarding-guard';

const labProfile = () => import('./views/lab-profile/lab-profile').then((m) => m.LabProfile);
const labForm = () => import('./views/lab-form/lab-form').then((m) => m.LabForm);

const staffList = () => import('./views/staff-list/staff-list').then((m) => m.StaffList);
const staffForm = () => import('./views/staff-form/staff-form').then((m) => m.StaffForm);

const productCatalog = () =>
  import('./views/product-catalog/product-catalog').then((m) => m.ProductCatalog);

const productForm = () => import('./views/product-form/product-form').then((m) => m.ProductForm);

const rawMaterialList = () =>
  import('./views/raw-material-list/raw-material-list').then((m) => m.RawMaterialList);

const rawMaterialForm = () =>
  import('./views/raw-material-form/raw-material-form').then((m) => m.RawMaterialForm);

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
      { path: 'staff-list', loadComponent: staffList },
      { path: 'staff-form', loadComponent: staffForm },
      { path: 'product-catalog', loadComponent: productCatalog },
      { path: 'product-form', loadComponent: productForm },
      { path: 'raw-material-list', loadComponent: rawMaterialList },
      { path: 'raw-material-form', loadComponent: rawMaterialForm },
      { path: 'raw-materials/:id', loadComponent: () => import('./views/raw-material-detail/raw-material-detail').then(m => m.RawMaterialDetail) },
      { path: '', redirectTo: 'lab-profile', pathMatch: 'full' },
    ],
  },
];
