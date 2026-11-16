/**
 * Raw material returned by `GET /laboratories/{laboratoryId}/environments/{environmentId}/raw-materials`, with the
 * fields Product Batch Management reads.
 */
export interface ConsumableRawMaterialResource {
  id: number;
  name: string;
  unit: string;
  usableStock: number;
}

/**
 * Lot returned by
 * `GET /laboratories/{laboratoryId}/environments/{environmentId}/raw-materials/{rawMaterialId}/batches?usable=true`,
 * with the fields Product Batch Management reads.
 */
export interface ConsumableLotResource {
  id: number;
  rawMaterialId: number;
  batchNumber: string;
  unit: string;
  availableAmount: number;
  expiresOn: string;
}
