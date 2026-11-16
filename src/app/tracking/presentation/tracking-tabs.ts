import { PageTab } from '../../shared/presentation/components/page-header/page-header';

/** Operations of the tracking module, as the tabs of its pages. */
export const TRACKING_TABS: readonly PageTab[] = [
  { labelKey: 'tracking.tabs.monitoring', link: '/tracking/monitoring' },
  { labelKey: 'tracking.tabs.history', link: '/tracking/history' },
  { labelKey: 'tracking.tabs.profiles', link: '/tracking/profiles' },
];
