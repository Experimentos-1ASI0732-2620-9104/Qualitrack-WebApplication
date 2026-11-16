import { PageTab } from '../../shared/presentation/components/page-header/page-header';

/** Operations of the products and batches module, as the tabs of its pages. */
export const BATCH_TABS: readonly PageTab[] = [
  { labelKey: 'product-catalog.title', link: '/batches/environments' },
  { labelKey: 'batches.title', link: '/batches' },
];
