import { OverviewLaboratory } from '../domain/model/overview-laboratory.entity';
import { OverviewEnvironment } from '../domain/model/overview-environment.entity';
import { OverviewRawMaterial } from '../domain/model/overview-raw-material.entity';
import { OverviewBatch } from '../domain/model/overview-batch.entity';
import { OverviewEquipment } from '../domain/model/overview-equipment.entity';
import { OverviewAlert } from '../domain/model/overview-alert.entity';
import { OverviewReading } from '../domain/model/overview-reading.entity';
import { OverviewSubscription } from '../domain/model/overview-subscription.entity';
import { OverviewPlan } from '../domain/model/overview-plan.entity';
import {
  OverviewAlertResource,
  OverviewBatchResource, OverviewEnvironmentalProfileResource,
  OverviewEnvironmentResource,
  OverviewEquipmentResource,
  OverviewLaboratoryResource,
  OverviewMeasurementResource,
  OverviewPlanResource,
  OverviewRawMaterialResource,
  OverviewSubscriptionResource,
} from './operational-overview-response';
import { OverviewEnvironmentalProfile } from '../domain/model/overview-environmental-profile.entity';

/**
 * Anti-Corruption Layer of the operational overview: translates the resources of Laboratory, Inventory, Product
 * Batch, Equipment, Compliance & Alerting, Tracking & Telemetry and Payments & Subscriptions into the models of
 * Reporting & Audit.
 */
export class OperationalOverviewAssembler {
  /**
   * Converts a laboratory resource into a domain entity.
   *
   * @param resource - Laboratory returned by the API.
   * @returns OverviewLaboratory domain entity.
   */
  toLaboratory(resource: OverviewLaboratoryResource): OverviewLaboratory {
    return new OverviewLaboratory({ id: resource.id, name: resource.name });
  }

  /**
   * Converts an environment resource into a domain entity.
   *
   * @param resource - Environment returned by the API.
   * @returns OverviewEnvironment domain entity.
   */
  toEnvironment(resource: OverviewEnvironmentResource): OverviewEnvironment {
    return new OverviewEnvironment({
      id: resource.id,
      code: resource.code,
      name: resource.name,
      usage: resource.usage ?? null,
    });
  }

  /**
   * Converts a raw material resource into a domain entity.
   *
   * @param resource - Raw material returned by the API.
   * @returns OverviewRawMaterial domain entity.
   */
  toRawMaterial(resource: OverviewRawMaterialResource): OverviewRawMaterial {
    return new OverviewRawMaterial({ id: resource.id, name: resource.name, stockStatus: resource.stockStatus });
  }

  /**
   * Converts a batch resource into a domain entity.
   *
   * @param resource - Batch returned by the API.
   * @returns OverviewBatch domain entity.
   */
  toBatch(resource: OverviewBatchResource): OverviewBatch {
    return new OverviewBatch({
      id: resource.id,
      batchNumber: resource.batchNumber,
      productName: resource.productName,
      status: resource.status,
      environmentId: resource.environmentId,
      productId: resource.productId,
    });
  }

  /**
   * Converts an equipment resource into a domain entity.
   *
   * @param resource - Equipment returned by the API.
   * @returns OverviewEquipment domain entity.
   */
  toEquipment(resource: OverviewEquipmentResource): OverviewEquipment {
    return new OverviewEquipment({
      id: resource.id,
      laboratoryId: resource.laboratoryId,
      environmentId: resource.environmentId,
      name: resource.name,
      deviceType: resource.deviceType,
    });
  }

  /**
   * Converts an alert resource into a domain entity.
   *
   * @param resource - Alert returned by the API.
   * @returns OverviewAlert domain entity.
   */
  toAlert(resource: OverviewAlertResource): OverviewAlert {
    return new OverviewAlert({
      id: resource.id,
      equipmentId: resource.equipmentId,
      parameterName: resource.parameterName,
      recordedValue: resource.recordedValue,
      unit: resource.unit,
      severity: resource.severity,
      status: resource.status,
      timestamp: resource.timestamp,
    });
  }

  /**
   * Converts a measurement resource into a domain entity.
   *
   * @param resource - Measurement returned by the API.
   * @returns OverviewReading domain entity.
   */
  toReading(resource: OverviewMeasurementResource): OverviewReading {
    return new OverviewReading({
      deviceId: resource.deviceId,
      metric: resource.metric,
      value: resource.value,
      unit: resource.unit,
      measuredAt: resource.measuredAt,
    });
  }

  /**
   * Converts a subscription resource into a domain entity.
   *
   * @param resource - Subscription returned by the API.
   * @returns OverviewSubscription domain entity.
   */
  toSubscription(resource: OverviewSubscriptionResource): OverviewSubscription {
    return new OverviewSubscription({
      laboratoryId: resource.laboratoryId,
      planCode: resource.planCode,
      billingCycle: resource.billingCycle,
      status: resource.status,
      currentPeriodEnd: resource.currentPeriodEnd ?? null,
    });
  }

  /**
   * Converts a plan resource into a domain entity.
   *
   * @param resource - Plan returned by the API.
   * @returns OverviewPlan domain entity.
   */
  toPlan(resource: OverviewPlanResource): OverviewPlan {
    return new OverviewPlan({
      code: resource.code,
      name: resource.name,
      billingPeriod: resource.billingCycle,
      priceAmount: resource.amount,
      currency: resource.currency,
      maxEquipment: resource.maxEquipment,
    });
  }

  /**
   * Converts an environmental profile resource into a domain entity.
   *
   * @param resource - Environmental profile received from the Tracking context.
   * @returns EnvironmentalProfile domain entity.
   */
  toEnvironmentalProfile(resource: OverviewEnvironmentalProfileResource): OverviewEnvironmentalProfile {
    return new OverviewEnvironmentalProfile(
      resource.id,
      resource.scope,
      resource.laboratoryId,
      resource.environmentId,
      resource.deviceId,
      resource.version,
      resource.thresholds.map(t => ({ ...t })), // Defensive copy to avoid external mutations
      resource.actuationRules.map(r => ({ ...r })),
      resource.updatedAt,
      resource.updatedBy
    );
  }
}
