import { PageTab } from '../../shared/presentation/components/page-header/page-header';

/**
 * Operations of the alerts module, as the tabs of its pages.
 *
 * @remarks
 * The environment chosen travels with the active alerts and the history; the preferences do not depend on it.
 *
 * @param environmentId - Environment chosen, or null for every environment
 * @returns The tabs of the module
 */
export function alertTabs(environmentId: number | null): PageTab[] {
  const queryParams = environmentId === null ? {} : { environmentId };
  return [
    { labelKey: 'ca-alerts.tabs.active', link: '/alerts', queryParams },
    { labelKey: 'ca-alerts.tabs.history', link: '/alerts/history', queryParams },
    { labelKey: 'ca-alerts.tabs.preferences', link: '/alerts/notification-settings' },
  ];
}
