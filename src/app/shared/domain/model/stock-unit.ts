/**
 * Stock quantity rules shared by Inventory and Product Batch, mirroring the platform's StockUnit value object.
 *
 * @remarks
 * Stock is kept in its recorded unit with at most three decimals; quantities in units are whole numbers.
 * The server validates the same rules; the views use them to warn before sending a request.
 */
export type StockQuantityViolation = 'wholeUnits' | 'precision';

/** Unit names that count whole items, in the spellings the platform accepts. */
const COUNTED_UNITS = ['unit', 'units', 'unidad', 'unidades'];

/** Whether stock in this unit is counted in whole items. */
export function isCountedUnit(unit: string): boolean {
  return COUNTED_UNITS.includes(unit.trim().toLowerCase());
}

/**
 * Checks a stock quantity against the rules of its unit.
 *
 * @param quantity - The quantity to check
 * @param unit - The unit the stock is recorded in
 * @returns The violated rule, or null when the quantity is valid
 */
export function stockQuantityViolation(quantity: number, unit: string): StockQuantityViolation | null {
  if (!Number.isFinite(quantity)) return 'precision';
  if (isCountedUnit(unit) && !Number.isInteger(quantity)) return 'wholeUnits';
  return Math.abs(quantity * 1000 - Math.round(quantity * 1000)) > 0.000001 ? 'precision' : null;
}
