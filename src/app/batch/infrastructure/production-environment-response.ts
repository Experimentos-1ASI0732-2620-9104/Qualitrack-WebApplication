/**
 * Environment returned by `GET /laboratories/{laboratoryId}/environments`, with the fields Product Batch Management reads.
 */
export interface ProductionEnvironmentResource {
  id: number;
  code: string;
  name: string;
  usage: string | null;
}
