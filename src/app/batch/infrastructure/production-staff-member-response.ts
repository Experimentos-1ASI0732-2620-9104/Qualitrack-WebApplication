/**
 * Staff member returned by `GET /laboratories/{laboratoryId}/staff`, with the fields Product Batch Management reads.
 */
export interface ProductionStaffMemberResource {
  id: number;
  fullName: string;
  role: string;
  active: boolean;
  accessRole: string | null;
  userId: number | null;
}
