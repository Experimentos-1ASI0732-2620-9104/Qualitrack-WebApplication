/**
 * Resources that Reporting & Audit reads from the other contexts for the operational overview (dashboard).
 *
 * @remarks
 * Each interface keeps only the fields of the REST resource that the overview uses; the
 * {@link OperationalOverviewAssembler} translates them into the models of Reporting & Audit.
 */

/** Laboratory returned by `GET /laboratories/{laboratoryId}`. */
export interface OverviewLaboratoryResource {
  id: number;
  name: string;
}

/** Environment returned by `GET /laboratories/{laboratoryId}/environments`. */
export interface OverviewEnvironmentResource {
  id: number;
  code: string;
  name: string;
  usage: string | null;
}

/** Raw material returned by `GET /laboratories/{laboratoryId}/environments/{environmentId}/raw-materials`. */
export interface OverviewRawMaterialResource {
  id: number;
  name: string;
  stockStatus: string;
}

/** Batch returned by `GET /laboratories/{laboratoryId}/batches`. */
export interface OverviewBatchResource {
  id: number;
  environmentId: number | null;
  productId: number;
  productName: string;
  batchNumber: string;
  status: string;
}

/** Equipment returned by `GET /laboratories/{laboratoryId}/equipments`. */
export interface OverviewEquipmentResource {
  id: number;
  laboratoryId: number;
  environmentId: number | null;
  name: string;
  deviceType: string | null;
}

/** Alert returned by `GET /laboratories/{laboratoryId}/environments/{environmentId}/deviation-alerts`. */
export interface OverviewAlertResource {
  id: number;
  equipmentId: number;
  parameterName: string;
  recordedValue: number;
  unit: string;
  severity: string;
  status: string;
  timestamp: string;
}

/** Measurement returned by the `telemetry-measurements` of an environment or a container monitor. */
export interface OverviewMeasurementResource {
  deviceId: number;
  metric: string;
  value: number | null;
  unit: string;
  measuredAt: string;
}

/** Subscription returned by `GET /laboratories/{laboratoryId}/subscriptions`. */
export interface OverviewSubscriptionResource {
  laboratoryId: number;
  planCode: string;
  billingCycle: string;
  status: string;
  currentPeriodEnd?: string | null;
}

/** Plan returned by `GET /subscription-plans`. */
export interface OverviewPlanResource {
  code: string;
  name: string;
  amount: number;
  currency: string;
  billingCycle: string;
  maxEquipment: number | null;
}

/**
 * Represents the configured threshold limits for an environmental metric.
 */
export interface OverviewEnvironmentalThresholdResource {
  metric: string;
  unit?: string;
  normalMin: number | null;
  normalMax: number | null;
  criticalMin: number | null;
  criticalMax: number | null;
}

/**
 * Environmental profile resource returned by Tracking.
 *
 * @remarks
 * Exposed by `GET .../environments/{envId}/environmental-profile` or
 * `GET .../container-monitors/{devId}/environmental-profile`.
 */
export interface OverviewEnvironmentalProfileResource {
  id: number;
  scope: 'ENVIRONMENT' | 'CONTAINER_MONITOR';
  laboratoryId: number;
  environmentId: number | null;
  deviceId: number | null;
  version: number;
  thresholds: OverviewEnvironmentalThresholdResource[];
  actuationRules: { metric: string; state: string; action: string }[];
  updatedAt: string | null;
  updatedBy: number | null;
}
