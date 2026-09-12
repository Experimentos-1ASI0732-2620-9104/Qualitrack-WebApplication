import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { MaintenanceRecord } from '../domain/model/maintenance-record.entity';
import { MaintenanceResource, MaintenancesResponse } from './maintenance-response';

/**
 * Assembler responsible for transforming maintenance data between
 * API resources and domain entities.
 *
 * @remarks
 * This class acts as a mapping layer between the infrastructure layer and
 * the domain layer. It converts maintenance resources received from the API
 * into MaintenanceRecord domain entities, and also converts MaintenanceRecord
 * entities back into API-compatible resources.
 *
 * Using an assembler helps keep the domain model independent from the
 * structure used by external services or HTTP responses.
 *
 * @example
 * ```typescript
 * const assembler = new MaintenanceAssembler();
 *
 * const record = assembler.toEntityFromResource({
 *   id: 'maintenance-001',
 *   equipmentId: 'equipment-001',
 *   maintenanceDate: '2026-05-12',
 *   technicianName: 'John Doe',
 *   description: 'Preventive maintenance and calibration performed.',
 *   type: 'PREVENTIVE',
 *   createdAt: '2026-05-12T10:00:00Z'
 * });
 *
 * console.log(record.type); // 'PREVENTIVE'
 * ```
 */
export class MaintenanceAssembler implements BaseAssembler<
  MaintenanceRecord,
  MaintenanceResource,
  MaintenancesResponse
> {
  /**
   * Converts a maintenance API response into a list of domain entities.
   *
   * @param response - The API response containing maintenance resources.
   * @returns An array of MaintenanceRecord domain entities.
   *
   * @remarks
   * This method maps each resource contained in the maintenances collection
   * and converts it into a MaintenanceRecord entity using toEntityFromResource.
   */
  toEntitiesFromResponse(response: MaintenancesResponse): MaintenanceRecord[] {
    return response.maintenances.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Converts a maintenance resource into a domain entity.
   *
   * @param resource - The maintenance resource received from the API.
   * @returns A MaintenanceRecord domain entity.
   *
   * @remarks
   * This method maps the raw API resource fields into the MaintenanceRecord
   * constructor, preserving the equipment reference, maintenance date,
   * technician information, description, maintenance type, and creation date.
   */
  toEntityFromResource(resource: MaintenanceResource): MaintenanceRecord {
    return new MaintenanceRecord({
      id: resource.id,
      equipmentId: resource.equipmentId,
      maintenanceDate: resource.maintenanceDate,
      technicianName: resource.technicianName,
      description: resource.description,
      type: resource.type,
      createdAt: resource.createdAt ?? ''
    });
  }

  /**
   * Converts a MaintenanceRecord domain entity into an API resource.
   *
   * @param entity - The MaintenanceRecord domain entity to be converted.
   * @returns A MaintenanceResource compatible with the API structure.
   *
   * @remarks
   * This method is useful when the application needs to serialize a maintenance
   * record using the structure expected by the infrastructure layer or backend API.
   */
  toResourceFromEntity(entity: MaintenanceRecord): MaintenanceResource {
    return {
      id: entity.id,
      equipmentId: entity.equipmentId,
      maintenanceDate: entity.maintenanceDate,
      technicianName: entity.technicianName,
      description: entity.description,
      type: entity.type,
      createdAt: entity.createdAt,
    } as MaintenanceResource;
  }
}
