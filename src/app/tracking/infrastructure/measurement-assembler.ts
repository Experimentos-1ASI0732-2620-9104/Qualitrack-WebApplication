import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Measurement } from '../domain/model/measurement.entity';
import { MeasurementResource, MeasurementsResponse } from './measurement-response';

/**
 * Assembler for converting between Measurement domain entities and API resources.
 *
 * @remarks
 * In DDD, this assembler keeps the domain layer independent from HTTP response
 * contracts by translating infrastructure resources into domain entities and
 * domain entities back into plain API resource objects.
 */
export class MeasurementAssembler implements BaseAssembler<
  Measurement,
  MeasurementResource,
  MeasurementsResponse
> {
  /**
   * Converts a measurement response envelope into domain entities.
   *
   * @param response - API response containing measurement resources
   * @returns Array of Measurement domain entities
   */
  toEntitiesFromResponse(response: MeasurementsResponse): Measurement[] {
    return response.measurements.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Converts a measurement API resource into a domain entity.
   *
   * @param resource - Measurement resource received from the API
   * @returns Measurement domain entity
   */
  toEntityFromResource(resource: MeasurementResource): Measurement {
    return new Measurement({
      id: resource.id,
      equipmentId: resource.equipmentId,
      parameterName: resource.parameterName,
      value: resource.value,
      unit: resource.unit,
      timestamp: resource.timestamp,
      createdAt: resource.createdAt,
    });
  }

  /**
   * Converts a Measurement domain entity into an API resource.
   *
   * @param entity - Measurement domain entity
   * @returns Measurement resource ready for API communication
   */
  toResourceFromEntity(entity: Measurement): MeasurementResource {
    return {
      id: entity.id,
      equipmentId: entity.equipmentId,
      parameterName: entity.parameterName,
      value: entity.value,
      unit: entity.unit,
      timestamp: entity.timestamp,
      createdAt: entity.createdAt,
    };
  }
}
