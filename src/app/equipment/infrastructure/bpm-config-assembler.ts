import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { BpmParameterConfig } from '../domain/model/bpm-parameter-config.entity';
import { BpmConfigResource, BpmConfigsResponse } from './bpm-config-response';

/**
 * Assembler responsible for transforming BPM configuration data between
 * API resources and domain entities.
 *
 * @remarks
 * This class acts as a mapping layer between the infrastructure layer and
 * the domain layer. It converts BPM configuration resources received from
 * the API into BpmParameterConfig domain entities, and also converts domain
 * entities back into API-compatible resources.
 *
 * In a layered architecture, this assembler helps keep the domain model
 * independent from the structure used by external services or HTTP responses.
 *
 * @example
 * ```typescript
 * const assembler = new BpmConfigAssembler();
 *
 * const entity = assembler.toEntityFromResource({
 *   id: 'config-001',
 *   equipmentId: 'equipment-001',
 *   parameterName: 'Temperature',
 *   minValue: 20,
 *   maxValue: 80,
 *   unit: '°C',
 *   createdAt: '2026-05-12T10:00:00Z'
 * });
 *
 * console.log(entity.parameterName); // 'Temperature'
 * ```
 */
export class BpmConfigAssembler implements BaseAssembler<
  BpmParameterConfig,
  BpmConfigResource,
  BpmConfigsResponse
> {
  /**
   * Converts a BPM configurations API response into a list of domain entities.
   *
   * @param response - The API response containing BPM configuration resources.
   * @returns An array of BpmParameterConfig domain entities.
   *
   * @remarks
   * This method iterates through the bpmConfigs collection from the response
   * and converts each resource into a domain entity using toEntityFromResource.
   */
  toEntitiesFromResponse(response: BpmConfigsResponse): BpmParameterConfig[] {
    return response.bpmConfigs.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Converts a BPM configuration resource into a domain entity.
   *
   * @param resource - The BPM configuration resource received from the API.
   * @returns A BpmParameterConfig domain entity.
   *
   * @remarks
   * This method maps the raw API resource fields into the constructor of
   * BpmParameterConfig, preserving the equipment reference, parameter name,
   * configured range, unit, and creation date.
   */
  toEntityFromResource(resource: BpmConfigResource): BpmParameterConfig {
    return new BpmParameterConfig({
      id: resource.id,
      equipmentId: resource.equipmentId,
      parameterName: resource.parameterName,
      minValue: resource.minValue,
      maxValue: resource.maxValue,
      unit: resource.unit,
      createdAt: resource.createdAt ?? ''
    });
  }

  /**
   * Converts a BPM parameter configuration domain entity into an API resource.
   *
   * @param entity - The BpmParameterConfig domain entity to be converted.
   * @returns A BpmConfigResource compatible with the API structure.
   *
   * @remarks
   * This method is useful when the application needs to send a BPM configuration
   * entity back to the infrastructure layer or serialize it using the resource
   * format expected by the API.
   */
  toResourceFromEntity(entity: BpmParameterConfig): BpmConfigResource {
    return {
      id: entity.id,
      equipmentId: entity.equipmentId,
      parameterName: entity.parameterName,
      minValue: entity.minValue,
      maxValue: entity.maxValue,
      unit: entity.unit,
      createdAt: entity.createdAt,
    } as BpmConfigResource;
  }
}
