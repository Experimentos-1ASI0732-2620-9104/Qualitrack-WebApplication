import { qualityManagerGuard } from '../../iam/infrastructure/role-guards';
import { Routes } from '@angular/router';

/** Lazy loader of the profile page. */
const profilePage = () =>
  import('./views/profile-page/profile-page').then((m) => m.ProfilePage);

/**
 * Route tree of the Profile bounded context: the profile of the signed-in user.
 *
 * @remarks
 * The page loads lazily at the empty path (`/profile`). A fragment such
 * as `/profile#notifications` opens the corresponding preferences page in CA.
 */
const profileRoutes: Routes = [
  { path: 'staff/:staffId', loadComponent: () => import('./views/staff-profile/staff-profile').then((m) => m.StaffProfilePage), canActivate: [qualityManagerGuard], title: 'page-titles.staff-profile' },
  { path: '', loadComponent: profilePage, title: 'page-titles.profile' },
];

export { profileRoutes };
