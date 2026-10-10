import { Routes } from '@angular/router';
import { Layout } from '../../shared/presentation/components/layout/layout';

/** Lazy loader of the profile page. */
const profilePage = () =>
  import('./views/profile-page/profile-page').then((m) => m.ProfilePage);

/**
 * Route tree of the Profile bounded context: the profile of the signed-in user.
 *
 * @remarks
 * The page is a child of the shared {@link Layout} and loads lazily at the empty path (`/profile`). A fragment such
 * as `/profile#notifications` scrolls to that section.
 */
const profileRoutes: Routes = [
  {
    path: '',
    component: Layout,
    children: [{ path: '', loadComponent: profilePage, title: 'Profile - QualiTrack' }],
  },
];

export { profileRoutes };
