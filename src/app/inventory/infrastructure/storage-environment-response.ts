/**
 * Environment returned by `GET /laboratories/{laboratoryId}/environments`, with the fields Inventory Management reads.
 */
export interface StorageEnvironmentResource {
  id: number;
  code: string;
  name: string;
  usage: string | null;
}
