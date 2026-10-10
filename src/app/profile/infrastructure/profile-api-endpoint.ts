import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type';
import { Profile } from '../domain/model/profile.entity';
import { ProfileAssembler } from './profile-assembler';
import { ProfileResource } from './profile-response';
import { UpdateProfileRequest } from './update-profile.request';

/** URL of the profile of the signed-in user (/users/me/profile). */
const myProfileUrl =
  `${environment.serverBasePath}${environment.usersEndpointPath}${environment.profileCurrentUserEndpointPath}`;

/**
 * HTTP endpoint client of the profiles: the one of the signed-in user (/users/me/profile) and, for the quality
 * manager, the one of a staff member (/laboratories/{laboratoryId}/staff/{staffId}/profile).
 *
 * @remarks
 * Every method fails with an `ApiError` that keeps the HTTP status and the details sent by the server. The photo
 * travels as raw binary content, not as JSON, so it is read and sent as a `Blob` / `File`.
 */
export class ProfileApiEndpoint extends ErrorHandlingEnabledBaseType {
  /** Converts the profile resources into {@link Profile} entities. */
  private readonly assembler = new ProfileAssembler();

  /**
   * Creates the endpoint client.
   *
   * @param http - Angular HttpClient used for the requests
   */
  constructor(private readonly http: HttpClient) {
    super();
  }

  /**
   * Retrieves the profile of the signed-in user.
   *
   * @returns Observable emitting the profile
   */
  getMine(): Observable<Profile> {
    return this.http.get<ProfileResource>(myProfileUrl).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to fetch the profile')),
    );
  }

  /**
   * Replaces the personal data of the profile of the signed-in user.
   *
   * @param request - DTO with the new personal data; null optional values clear the field
   * @returns Observable emitting the saved profile
   */
  updateMine(request: UpdateProfileRequest): Observable<Profile> {
    return this.http.put<ProfileResource>(myProfileUrl, request).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to update the profile')),
    );
  }

  /**
   * Downloads the photo of the signed-in user.
   *
   * @returns Observable emitting the image as a binary Blob
   */
  getMyPhoto(): Observable<Blob> {
    return this.http.get(`${myProfileUrl}${environment.profilePhotoEndpointPath}`, { responseType: 'blob' }).pipe(
      catchError(this.handleError('Failed to fetch the profile photo')),
    );
  }

  /**
   * Replaces the photo of the signed-in user.
   *
   * @remarks
   * Sends the image itself as the body (JPEG, PNG or WebP up to 2 MB), with its MIME type as the Content-Type.
   *
   * @param image - Image file chosen by the user
   * @returns Observable emitting the profile with the new photo data
   */
  replaceMyPhoto(image: File): Observable<Profile> {
    return this.http.put<ProfileResource>(`${myProfileUrl}${environment.profilePhotoEndpointPath}`, image, {
      headers: { 'Content-Type': image.type },
    }).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError('Failed to replace the profile photo')),
    );
  }

  /**
   * Removes the photo of the signed-in user.
   *
   * @returns Observable that completes once the photo is removed
   */
  removeMyPhoto(): Observable<void> {
    return this.http.delete<void>(`${myProfileUrl}${environment.profilePhotoEndpointPath}`).pipe(
      catchError(this.handleError('Failed to remove the profile photo')),
    );
  }

  /**
   * Retrieves the profile of a staff member of a laboratory. Only the quality manager can read it.
   *
   * @param laboratoryId - Numeric id of the laboratory
   * @param staffId - Numeric id of the staff member
   * @returns Observable emitting the profile of the staff member
   */
  getStaffProfile(laboratoryId: number, staffId: number): Observable<Profile> {
    return this.http.get<ProfileResource>(this.staffProfileUrl(laboratoryId, staffId)).pipe(
      map((resource) => this.assembler.toEntityFromResource(resource)),
      catchError(this.handleError(`Failed to fetch the profile of staff member ${staffId}`)),
    );
  }

  /**
   * Downloads the photo of a staff member of a laboratory.
   *
   * @param laboratoryId - Numeric id of the laboratory
   * @param staffId - Numeric id of the staff member
   * @returns Observable emitting the image as a binary Blob
   */
  getStaffPhoto(laboratoryId: number, staffId: number): Observable<Blob> {
    return this.http.get(`${this.staffProfileUrl(laboratoryId, staffId)}${environment.profilePhotoEndpointPath}`,
      { responseType: 'blob' }).pipe(
      catchError(this.handleError(`Failed to fetch the photo of staff member ${staffId}`)),
    );
  }

  /**
   * Builds the URL of the profile of a staff member.
   *
   * @param laboratoryId - Numeric id of the laboratory
   * @param staffId - Numeric id of the staff member
   * @returns `/laboratories/{laboratoryId}/staff/{staffId}/profile` under the server base path
   */
  private staffProfileUrl(laboratoryId: number, staffId: number): string {
    return `${environment.serverBasePath}${environment.laboratoryLabsEndpointPath}/${laboratoryId}`
      + `${environment.laboratoryStaffEndpointPath}/${staffId}${environment.profileEndpointPath}`;
  }
}
