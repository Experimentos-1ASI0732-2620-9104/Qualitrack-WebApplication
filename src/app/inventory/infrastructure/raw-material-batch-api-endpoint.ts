import { HttpClient } from '@angular/common/http';
import { catchError, map } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { RawMaterialBatch } from '../domain/model/raw-material-batch.entity';
import {
  RawMaterialBatchResource,
  RawMaterialBatchesResponse,
} from './raw-material-batch-response';
import { RawMaterialBatchAssembler } from './raw-material-batch-assembler';
import {
  ReceiveRawMaterialBatchRequest,
  ReviewRawMaterialBatchRequest,
  ConsumeRawMaterialBatchRequest,
} from './raw-material-batch.request';
import {
  AvailableReceiptResource,
  ReceiptConsumptionResponse,
} from './receipt-consumption-response';
import { AvailableReceipt } from '../domain/model/available-receipt.entity';
import { RawMaterialBatchConsumption } from '../domain/model/raw-material-batch-consumption.result';

export class RawMaterialBatchApiEndpoint extends BaseApiEndpoint<
  RawMaterialBatch,
  RawMaterialBatchResource,
  RawMaterialBatchesResponse,
  RawMaterialBatchAssembler
> {
  constructor(http: HttpClient) {
    super(
      http,
      environment.serverBasePath + environment.laboratoryLabsEndpointPath,
      new RawMaterialBatchAssembler(),
    );
  }
  private root(lab: number) {
    return `${this.endpointUrl}/${lab}${environment.inventoryEndpointPath}`;
  }
  getByMaterial(lab: number, material: number) {
    return this.http
      .get<RawMaterialBatchResource[]>(`${this.root(lab)}/materials/${material}/receipts`)
      .pipe(
        map((resources) =>
          resources.map((resource) => this.assembler.toEntityFromResource(resource)),
        ),
        catchError(this.handleError('Failed to load supplier receipts')),
      );
  }
  getUsable(lab: number, material: number) {
    return this.http
      .get<AvailableReceiptResource[]>(`${this.root(lab)}/materials/${material}/usable-receipts`)
      .pipe(
        map((resources) =>
          resources.map((resource): AvailableReceipt => ({
            id: resource.id,
            rawMaterialId: resource.rawMaterialId,
            batchNumber: resource.batchNumber,
            unit: resource.unit,
            availableAmount: resource.availableAmount,
            expiresOn: resource.expiresOn,
          })),
        ),
        catchError(this.handleError('Failed to load available receipts')),
      );
  }
  receive(lab: number, material: number, request: ReceiveRawMaterialBatchRequest) {
    return this.http
      .post<RawMaterialBatchResource>(`${this.root(lab)}/materials/${material}/receipts`, request)
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError(this.handleError('Failed to register receipt')),
      );
  }
  review(lab: number, receipt: number, request: ReviewRawMaterialBatchRequest) {
    return this.http
      .post<RawMaterialBatchResource>(`${this.root(lab)}/receipts/${receipt}/reviews`, request)
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError(this.handleError('Failed to review receipt')),
      );
  }
  consume(lab: number, request: ConsumeRawMaterialBatchRequest) {
    return this.http
      .post<ReceiptConsumptionResponse>(`${this.root(lab)}/consumptions`, request)
      .pipe(
        map((resource): RawMaterialBatchConsumption => ({
          rawMaterialBatchId: resource.rawMaterialBatchId,
          productBatchId: resource.productBatchId,
          amountUsed: resource.amountUsed,
          unit: resource.unit,
          stockBefore: resource.stockBefore,
          stockAfter: resource.stockAfter,
          operationId: resource.operationId,
        })),
        catchError(this.handleError('Failed to consume receipt')),
      );
  }
}
