export interface CreateBatchRequest {
  labId: number;
  productId: number;
  batchNumber: string;
  quantity: number;
  unit: string;
  startDate: string;
  notes?: string;
}

export interface ReleaseBatchRequest {
  status: 'RELEASED';
  releaseDate: string;
  notes: string;
}

export interface RejectBatchRequest {
  status: 'REJECTED';
  rejectionDate: string;
  reason: string;
}

export type UpdateBatchStatusRequest = ReleaseBatchRequest | RejectBatchRequest;
