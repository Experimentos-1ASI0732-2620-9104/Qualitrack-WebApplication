/**
 * Staff member returned by `GET /laboratories/{laboratoryId}/staff`, with the fields Equipment Management reads.
 */
export interface MaintenanceTechnicianResource {
  id: number;
  fullName: string;
  role: string;
  active: boolean;
  accessRole: string | null;
  userId: number | null;
}
