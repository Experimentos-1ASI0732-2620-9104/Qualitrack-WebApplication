/** Fields read from the pre-Inventory Laboratory material resource. */
export interface LegacyMaterialSnapshotResource {
  id: number;
  name: string;
  code: string;
  supplier: string;
  batchNumber: string;
  expirationDate: string;
  currentStock: number;
  unit: string;
  minimumThreshold: number;
}
