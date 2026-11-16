/**
 * Environment returned by `GET /laboratories/{laboratoryId}/environments`, with the fields Compliance & Alerts reads.
 */
export interface AlertEnvironmentResource {
  id: number;
  code: string;
  name: string;
  usage: string | null;
}
