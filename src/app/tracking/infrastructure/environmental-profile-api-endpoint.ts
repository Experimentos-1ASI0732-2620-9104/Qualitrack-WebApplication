import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { BaseApiEndpoint } from '../../shared/infrastructure/base-api-endpoint';
import { environment } from '../../../environments/environment';
import { ActuationRule, EnvironmentalProfile, ThresholdInput } from '../domain/model/environmental-profile.entity';
import { EnvironmentalProfileAssembler } from './environmental-profile-assembler';
import { EnvironmentalProfileResource, EnvironmentalProfilesResponse } from './tracking-response';
import { DeviceTarget } from './device-target';
import { targetPath } from './telemetry-request';

const laboratoriesEndpointUrl = `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}`;

/**
 * Endpoint responsible for managing environmental profile configuration.
 *
 * Handles:
 * - Retrieving active environmental profiles.
 * - Updating metric thresholds.
 * - Updating automatic actuation rules.
 *
 * Profile data is transformed into EnvironmentalProfile domain entities
 * through the configured assembler.
 */
export class EnvironmentalProfileApiEndpoint extends BaseApiEndpoint<
  EnvironmentalProfile,
  EnvironmentalProfileResource,
  EnvironmentalProfilesResponse,
  EnvironmentalProfileAssembler
> {
  constructor(http: HttpClient) {
    super(http, laboratoriesEndpointUrl, new EnvironmentalProfileAssembler());
  }

  /**
   * Retrieves the active environmental profile.
   *
   * Returns null when the profile has not been configured yet.
   *
   * @param target Environment or device target.
   * @returns Observable containing the environmental profile.
   */
  getProfile(target: DeviceTarget): Observable<EnvironmentalProfile | null> {
    return this.http.get<EnvironmentalProfileResource>(this.profileUrl(target)).pipe(
      map((resource): EnvironmentalProfile | null => this.assembler.toEntityFromResource(resource)),
      catchError((error: HttpErrorResponse) =>
        error.status === 404
          ? of(null)
          : this.handleError('Failed to fetch the environmental profile')(error),
      ),
    );
  }

  /**
   * Updates environmental threshold configurations.
   *
   * Threshold updates define the acceptable measurement ranges
   * used to evaluate environmental conditions.
   *
   * @param target Environment or device target.
   * @param thresholds Threshold configuration values.
   * @returns Observable containing the updated environmental profile.
   */
  updateThresholds(
    target: DeviceTarget,
    thresholds: ThresholdInput[],
  ): Observable<EnvironmentalProfile> {
    return this.http
      .put<EnvironmentalProfileResource>(
        `${this.profileUrl(target)}${environment.trackingThresholdsEndpointPath}`,
        { thresholds },
      )
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError(this.handleError('Failed to save the thresholds')),
      );
  }

  /**
   * Updates automatic actuation rules.
   *
   * These rules define device actions triggered by abnormal
   * environmental conditions.
   *
   * @param target Target device.
   * @param rules Actuation rules configuration.
   * @returns Observable containing the updated environmental profile.
   */
  updateActuationRules(
    target: DeviceTarget,
    rules: ActuationRule[],
  ): Observable<EnvironmentalProfile> {
    return this.http
      .put<EnvironmentalProfileResource>(
        `${this.profileUrl(target)}${environment.trackingActuationRulesEndpointPath}`,
        { rules },
      )
      .pipe(
        map((resource) => this.assembler.toEntityFromResource(resource)),
        catchError(this.handleError('Failed to save the actuation rules')),
      );
  }

  /**
   * Builds the URL used for environmental profile operations.
   *
   * @param target Environment or device target.
   * @returns Complete profile endpoint URL.
   */
  private profileUrl(target: DeviceTarget): string {
    return `${targetPath(this.endpointUrl, target)}${environment.trackingEnvironmentalProfileEndpointPath}`;
  }
}
