/**
 * Equipment returned by `GET /laboratories/{laboratoryId}/equipments`, with the fields Product Batch Management reads.
 */
export interface ProductionEquipmentResource {
  id: number;
  laboratoryId: number;
  environmentId: number | null;
  name: string;
  serialNumber: string;
  status: string;
  deviceType: string | null;
}
