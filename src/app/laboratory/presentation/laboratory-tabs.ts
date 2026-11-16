import { PageTab } from '../../shared/presentation/components/page-header/page-header';

/** Operations of the laboratory module, as the tabs of its pages. */
export const LABORATORY_TABS: readonly PageTab[] = [
  { labelKey: 'lab-profile.tab', link: '/laboratories/profile' },
  { labelKey: 'nav.environments', link: '/laboratories/environments' },
  { labelKey: 'nav.staff-list', link: '/laboratories/staff' },
];
