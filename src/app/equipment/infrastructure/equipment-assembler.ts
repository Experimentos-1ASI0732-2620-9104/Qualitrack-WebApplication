import { BaseAssembler } from '../../shared/infrastructure/base-assembler';
import { Equipment } from '../domain/model/equipment.entity';
import { EquipmentStatus } from '../domain/model/equipment-status';
import { IotDeviceType } from '../domain/model/iot-device-type';
import { EquipmentResource, EquipmentsResponse } from './equipment-response';

/**
 * Assembler responsible for transforming equipment data between
 * API resources and domain entities.
 *
 * @remarks
 * This class acts as a mapping layer between the infrastructure layer and
 * the domain layer. It converts equipment resources received from the API
 * into Equipment domain entities, and also converts Equipment entities back
 * into API-compatible resources.
 *
 * Using an assembler helps keep the domain model independent from the
 * structure used by external services or HTTP responses.
 *
 * @example
 * ```typescript
 * const assembler = new EquipmentAssembler();
 *
 * const equipment = assembler.toEntityFromResource({
 *   id: 1,
 *   laboratoryId: 10,
 *   environmentId: null,
 *   name: 'Centrifuge',
 *   type: 'Laboratory Equipment',
 *   model: 'CF-3000',
 *   serialNumber: 'SN-2026-001',
 *   status: 'OPERATIONAL',
 *   deviceType: null,
 *   sensorExternalId: null,
 *   firmwareVersion: null,
 *   createdAt: '2026-05-12T10:00:00Z'
 * });
 *
 * console.log(equipment.name); // 'Centrifuge'
 * ```
 */
export class EquipmentAssembler implements BaseAssembler<
  Equipment,
  EquipmentResource,
  EquipmentsResponse
> {
  /**
   * Converts an equipment API response into a list of domain entities.
   *
   * @remarks
   * This method maps each resource contained in the equipments collection
   * and converts it into an Equipment entity using toEntityFromResource.
   *
   * @param response - The API response containing equipment resources.
   * @returns An array of Equipment domain entities.
   */
  toEntitiesFromResponse(response: EquipmentsResponse): Equipment[] {
    return response.equipments.map((resource) => this.toEntityFromResource(resource));
  }

  /**
   * Converts an equipment resource into a domain entity.
   *
   * @remarks
   * This method maps the raw API resource fields into the Equipment constructor,
   * preserving its laboratory reference, identification data, technical
   * information, operational status, and creation date.
   *
   * The resource `laboratoryId` is mapped to the entity `labId`. The status and
   * device type are cast to `EquipmentStatus` and `IotDeviceType`. When the
   * optional fields are missing, `environmentId`, `deviceType`, `sensorExternalId`
   * and `firmwareVersion` default to `null`, and `createdAt` defaults to an empty string.
   *
   * @param resource - The equipment resource received from the API.
   * @returns An Equipment domain entity.
   */
  toEntityFromResource(resource: EquipmentResource): Equipment {
    return new Equipment({
      id: resource.id,
      labId: resource.laboratoryId,
      environmentId: resource.environmentId ?? null,
      name: resource.name,
      type: resource.type,
      model: resource.model,
      serialNumber: resource.serialNumber,
      status: resource.status as EquipmentStatus,
      deviceType: (resource.deviceType ?? null) as IotDeviceType | null,
      sensorExternalId: resource.sensorExternalId ?? null,
      firmwareVersion: resource.firmwareVersion ?? null,
      createdAt: resource.createdAt ?? ''
    });
  }

  /**
   * Converts an Equipment domain entity into an API resource.
   *
   * @remarks
   * This method is useful when the application needs to serialize an equipment
   * entity using the structure expected by the infrastructure layer or backend API.
   * The entity `labId` is mapped to the resource `laboratoryId`.
   *
   * @param entity - The Equipment domain entity to be converted.
   * @returns An EquipmentResource compatible with the API structure.
   */
  toResourceFromEntity(entity: Equipment): EquipmentResource {
    return {
      id: entity.id,
      laboratoryId: entity.labId,
      environmentId: entity.environmentId,
      name: entity.name,
      type: entity.type,
      model: entity.model,
      serialNumber: entity.serialNumber,
      status: entity.status,
      deviceType: entity.deviceType,
      sensorExternalId: entity.sensorExternalId,
      firmwareVersion: entity.firmwareVersion,
      createdAt: entity.createdAt,
    } as EquipmentResource;
  }
}
