/**
 * Environment returned by `GET /laboratories/{laboratoryId}/environments`, with the fields Equipment Management reads.
 */
export interface InstallationEnvironmentResource {
  id: number;
  code: string;
  name: string;
  usage: string | null;
}
