/**
 * Main use of an environment of a laboratory or pharmaceutical warehouse.
 *
 * @remarks
 * Mirrors the backend `EnvironmentUsage` enumeration of the Laboratory bounded context.
 *
 * - `LABORATORY`: quality control and analysis area.
 * - `PRODUCTION`: area where product batches are manufactured.
 * - `RAW_MATERIAL_STORAGE`: warehouse for raw materials.
 * - `PRODUCT_STORAGE`: warehouse for finished products.
 * - `OTHER`: any other use.
 *
 * @see {@link ENVIRONMENT_USAGES} for the display order of the values.
 */
export type EnvironmentUsage =
  | 'LABORATORY'
  | 'PRODUCTION'
  | 'RAW_MATERIAL_STORAGE'
  | 'PRODUCT_STORAGE'
  | 'OTHER';

/**
 * Allowed environment usages, in the order shown to users.
 *
 * @remarks
 * Used by the presentation layer to build usage selectors and menus.
 */
export const ENVIRONMENT_USAGES: readonly EnvironmentUsage[] = [
  'LABORATORY',
  'PRODUCTION',
  'RAW_MATERIAL_STORAGE',
  'PRODUCT_STORAGE',
  'OTHER',
];
