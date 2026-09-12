import { BaseResource, BaseResponse } from '../../shared/infrastructure/base-response';
import { AlertSeverity, AlertStatus } from '../domain/model/deviation-alert.entity';

/**
 * Resource representation of a deviation alert for API communication.
 *
 * @remarks
 * In DDD, this is an infrastructure-level resource contract that represents
 * the deviation alert as it appears in HTTP communication, without domain logic.
 * Resources are distinct from domain entities, serving as the bridge between
 * the domain layer and external systems (like a REST API).
 */
export interface AlertResource extends BaseResource {
  /**
   * The unique numeric identifier for the alert resource.
   */
  id: number;

  /**
   * The numeric identifier of the equipment that generated the alert.
   */
  equipmentId: number;

  /**
   * The numeric identifier of the production batch, if applicable.
   */
  batchId?: number;

  /**
   * The name of the monitored process parameter.
   */
  parameterName: string;

  /**
   * The measured value that triggered the deviation.
   */
  recordedValue: number;

  /**
   * The reference limit value for the parameter.
   */
  thresholdValue: number;

  /**
   * The unit of measurement for the values.
   */
  unit: string;

  /**
   * The timestamp of when the deviation occurred.
   */
  timestamp: string;

  /**
   * The urgency or impact level of the alert.
   */
  severity: AlertSeverity;

  /**
   * The current status of the alert in the system.
   */
  status: AlertStatus;

  /**
   * The timestamp of when the resource was created.
   */
  createdAt?: string;
}

/**
 * Response envelope for alert collection queries.
 *
 * @remarks
 * This interface defines the structure of API responses that return multiple deviation alerts.
 * The envelope pattern allows for consistent metadata handling across all collection endpoints
 * in the manufacturing or quality domain.
 */
export interface AlertsResponse extends BaseResponse {
  /**
   * Array of alert resources included in the response.
   * Contains zero or more AlertResource objects.
   */
  alerts: AlertResource[];
}
