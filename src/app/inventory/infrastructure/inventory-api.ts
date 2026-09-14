import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { RawMaterialApiEndpoint } from './raw-material-api-endpoint';
import { RawMaterialBatchApiEndpoint } from './raw-material-batch-api-endpoint';
import { InventoryMovementApiEndpoint } from './inventory-movement-api-endpoint';
import { LegacyInventoryApiEndpoint } from './legacy-inventory-api-endpoint';
import { SaveRawMaterialRequest } from './raw-material.request';
import { ReceiveRawMaterialBatchRequest } from './raw-material-batch.request';
import { RawMaterialBatchStatus } from '../domain/model/raw-material-batch.entity';

/** Inventory gateway: stores depend on this facade, not on individual HTTP endpoint clients. */
@Injectable({ providedIn: 'root' })
export class InventoryApi extends BaseApi {
  private readonly materialEndpoint: RawMaterialApiEndpoint;
  private readonly receiptEndpoint: RawMaterialBatchApiEndpoint;
  private readonly movementEndpoint: InventoryMovementApiEndpoint;
  private readonly legacyEndpoint: LegacyInventoryApiEndpoint;
  constructor(http: HttpClient) {
    super();
    this.materialEndpoint = new RawMaterialApiEndpoint(http);
    this.receiptEndpoint = new RawMaterialBatchApiEndpoint(http);
    this.movementEndpoint = new InventoryMovementApiEndpoint(http);
    this.legacyEndpoint = new LegacyInventoryApiEndpoint(http);
  }
  materials(lab: number) {
    return this.materialEndpoint.getByLaboratory(lab);
  }
  save(lab: number, request: SaveRawMaterialRequest, id?: number) {
    return this.materialEndpoint.saveMaterial(lab, request, id);
  }
  receipts(lab: number, material: number) {
    return this.receiptEndpoint.getByMaterial(lab, material);
  }
  usable(lab: number, material: number) {
    return this.receiptEndpoint.getUsable(lab, material);
  }
  receive(lab: number, material: number, request: ReceiveRawMaterialBatchRequest) {
    return this.receiptEndpoint.receive(lab, material, request);
  }
  review(lab: number, receipt: number, status: RawMaterialBatchStatus, reason: string) {
    return this.receiptEndpoint.review(lab, receipt, { status, reason });
  }
  movements(lab: number, material: number) {
    return this.movementEndpoint.getByMaterial(lab, material);
  }
  consume(
    lab: number,
    receiptId: number,
    productBatchId: number,
    amount: number,
    unit: string,
    operationId: string,
  ) {
    return this.receiptEndpoint.consume(lab, {
      receiptId,
      productBatchId,
      amount,
      unit,
      operationId,
    });
  }
  legacy(lab: number) {
    return this.legacyEndpoint.pending(lab);
  }
  import(lab: number, id: number) {
    return this.legacyEndpoint.importMaterial(lab, id);
  }
}
