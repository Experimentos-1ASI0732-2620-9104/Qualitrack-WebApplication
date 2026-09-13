/** Catalog entry. Stock, supplier and expiry are not editable catalog attributes. */
export interface RawMaterial {
  readonly id: number;
  readonly laboratoryId: number;
  readonly code: string;
  readonly name: string;
  readonly unit: InventoryUnit;
  readonly minimumStock: number;
}

export type InventoryUnit = 'kg' | 'g' | 'L' | 'mL' | 'units';
