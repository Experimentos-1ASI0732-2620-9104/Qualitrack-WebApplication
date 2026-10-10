import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseApi } from '../../shared/infrastructure/base-api';
import { Profile } from '../domain/model/profile.entity';
import { ProfileApiEndpoint } from './profile-api-endpoint';
import { UpdateProfileRequest } from './update-profile.request';

/**
 * HTTP API facade of the Profile bounded context.
 *
 * @remarks
 * It is the only entry point the application layer ({@link ProfileStore}) uses to reach the platform; it delegates
 * every call to the {@link ProfileApiEndpoint}, so the store never deals with URLs or resources.
 */
@Injectable({ providedIn: 'root' })
export class ProfileApi extends BaseApi {
  /** Endpoint client of the profiles and their photos. */
  private readonly profileEndpoint: ProfileApiEndpoint;

  /**
   * Creates the facade and its endpoint client.
   *
   * @param http - Angular HttpClient shared with the endpoint client
   */
  constructor(http: HttpClient) {
    super();
    this.profileEndpoint = new ProfileApiEndpoint(http);
  }

  /**
   * Retrieves the profile of the signed-in user.
   *
   * @returns Observable emitting the profile
   */
  getMyProfile(): Observable<Profile> {
    return this.profileEndpoint.getMine();
  }

  /**
   * Replaces the personal data of the signed-in user.
   *
   * @param request - DTO with the new personal data
   * @returns Observable emitting the saved profile
   */
  updateMyProfile(request: UpdateProfileRequest): Observable<Profile> {
    return this.profileEndpoint.updateMine(request);
  }

  /**
   * Downloads the photo of the signed-in user.
   *
   * @returns Observable emitting the image as a binary Blob
   */
  getMyPhoto(): Observable<Blob> {
    return this.profileEndpoint.getMyPhoto();
  }

  /**
   * Replaces the photo of the signed-in user.
   *
   * @param image - JPEG, PNG or WebP image up to 2 MB
   * @returns Observable emitting the profile with the new photo data
   */
  replaceMyPhoto(image: File): Observable<Profile> {
    return this.profileEndpoint.replaceMyPhoto(image);
  }

  /**
   * Removes the photo of the signed-in user.
   *
   * @returns Observable that completes once the photo is removed
   */
  removeMyPhoto(): Observable<void> {
    return this.profileEndpoint.removeMyPhoto();
  }

  /**
   * Profile of a staff member; only the quality manager of the laboratory can read it.
   *
   * @param laboratoryId - Numeric id of the laboratory
   * @param staffId - Numeric id of the staff member
   * @returns Observable emitting the profile of the staff member
   */
  getStaffProfile(laboratoryId: number, staffId: number): Observable<Profile> {
    return this.profileEndpoint.getStaffProfile(laboratoryId, staffId);
  }

  /**
   * Downloads the photo of a staff member of a laboratory.
   *
   * @param laboratoryId - Numeric id of the laboratory
   * @param staffId - Numeric id of the staff member
   * @returns Observable emitting the image as a binary Blob
   */
  getStaffPhoto(laboratoryId: number, staffId: number): Observable<Blob> {
    return this.profileEndpoint.getStaffPhoto(laboratoryId, staffId);
  }
}
