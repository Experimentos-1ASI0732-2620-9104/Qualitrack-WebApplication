/**
 * Equipment returned by `GET /laboratories/{laboratoryId}/equipments`, with the fields Inventory Management reads.
 */
export interface StorageContainerResource {
  id: number;
  environmentId: number | null;
  name: string;
  serialNumber: string;
  status: string;
  /** `CONTAINER_MONITOR` for the containers where lots are stored. */
  deviceType: string | null;
}
