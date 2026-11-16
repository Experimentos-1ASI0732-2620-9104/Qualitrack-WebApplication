import { PageTab } from '../../shared/presentation/components/page-header/page-header';

/** Operations of the reports module, as the tabs of its pages. */
export const REPORTS_TABS: readonly PageTab[] = [
  { labelKey: 'reporting.tabs.summary', link: '/reports/kpis' },
  { labelKey: 'reporting.tabs.deviations', link: '/reports/deviation-trends' },
  { labelKey: 'reporting.tabs.generator', link: '/reports/new' },
  { labelKey: 'reporting.tabs.audit-log', link: '/reports/audit-log' },
];
