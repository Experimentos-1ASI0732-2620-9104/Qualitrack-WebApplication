import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Observable, catchError, map, of, switchMap, tap } from 'rxjs';

import { Profile } from '../domain/model/profile.entity';
import { UpdateProfileCommand } from '../domain/model/update-profile.command';
import { ProfileApi } from '../infrastructure/profile-api';
import { IamStore } from '../../iam/application/iam.store';

/** Largest photo the platform accepts. */
export const MAX_PHOTO_BYTES = 2 * 1024 * 1024;

/** Image types the platform accepts as photo. */
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Profile of a staff member with its photo, as the quality manager sees it. */
export interface StaffProfile {
  /** Profile of the staff member. */
  profile: Profile;
  /** Object URL of the photo; the view that shows it revokes it. */
  photoUrl: string | null;
}

/**
 * Application store of the profile of the signed-in user: personal data and photo, shown in the toolbar and edited
 * in the profile page.
 *
 * @remarks
 * Provided in root so the toolbar and the profile page share it. Everything is cleared when another person signs in.
 */
@Injectable({ providedIn: 'root' })
export class ProfileStore {
  /** HTTP facade of the Profile bounded context. */
  private readonly api = inject(ProfileApi);
  /** Session store; tells who is signed in. */
  private readonly iam = inject(IamStore);

  /** Profile of the signed-in user, or null until it is loaded. */
  private readonly profileSignal = signal<Profile | null>(null);
  /** Object URL of the photo of the signed-in user. */
  private readonly photoUrlSignal = signal<string | null>(null);
  /** Whether the profile is being loaded. */
  private readonly loadingSignal = signal(false);
  /** Whether the latest load failed. */
  private readonly errorSignal = signal(false);
  /** Id of the user whose profile is loaded, to know when another person signed in. */
  private loadedFor: number | null = null;

  /** Profile of the signed-in user, or null until it is loaded. */
  readonly profile = this.profileSignal.asReadonly();

  /** Object URL of the photo of the signed-in user, or null without photo. */
  readonly photoUrl = this.photoUrlSignal.asReadonly();

  /** Whether the profile is being loaded. */
  readonly loading = this.loadingSignal.asReadonly();

  /** Whether the profile could not be loaded. */
  readonly failed = this.errorSignal.asReadonly();

  /** Name shown in the toolbar: the full name of the profile, or the username until it is completed. */
  readonly displayName = computed(() => this.profile()?.displayName ?? this.iam.currentUsername() ?? '');

  /** Initials shown in the avatar when there is no photo. */
  readonly initials = computed(() => this.profile()?.initials ?? this.iam.currentUserInitials());

  /**
   * Creates the store.
   *
   * @remarks
   * Watches the signed-in user and clears the profile and photo when it changes (sign-out or another sign-in), so the
   * data of one person is never shown to the next one.
   */
  constructor() {
    effect(() => {
      const userId = this.iam.currentUserId();
      untracked(() => {
        if (userId !== this.loadedFor) this.reset();
      });
    });
  }

  /** Loads the profile of the signed-in user the first time it is needed in the session. */
  ensureLoaded(): void {
    const userId = this.iam.currentUserId();
    if (!userId || this.loadedFor === userId || this.loadingSignal()) return;
    this.load();
  }

  /** Loads the profile again, for example after the account changed. */
  load(): void {
    const userId = this.iam.currentUserId();
    if (!userId) return;
    this.loadingSignal.set(true);
    this.errorSignal.set(false);
    this.api.getMyProfile().subscribe({
      next: (profile) => {
        this.loadedFor = userId;
        this.profileSignal.set(profile);
        this.loadingSignal.set(false);
        if (profile.hasPhoto) this.loadPhoto();
        else this.setPhotoUrl(null);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set(true);
      },
    });
  }

  /**
   * Saves the personal data of the signed-in user.
   *
   * @remarks
   * Trims the values and sends blank optional fields as null, so the platform clears them.
   *
   * @param command - Personal data typed in the profile page
   * @returns Observable emitting the saved profile, which also replaces the one in the store
   */
  update(command: UpdateProfileCommand): Observable<Profile> {
    return this.api.updateMyProfile({
      fullName: command.fullName.trim(),
      dni: blankToNull(command.dni),
      phoneNumber: blankToNull(command.phoneNumber),
      location: blankToNull(command.location),
    }).pipe(tap((profile) => this.profileSignal.set(profile)));
  }

  /**
   * Replaces the photo and shows the chosen file right away.
   *
   * @param image - JPEG, PNG or WebP image up to {@link MAX_PHOTO_BYTES}
   * @returns Observable emitting the profile with the new photo data
   */
  replacePhoto(image: File): Observable<Profile> {
    return this.api.replaceMyPhoto(image).pipe(tap((profile) => {
      this.profileSignal.set(profile);
      this.setPhotoUrl(URL.createObjectURL(image));
    }));
  }

  /**
   * Removes the photo of the signed-in user; the avatar goes back to the initials.
   *
   * @returns Observable that completes once the photo is removed
   */
  removePhoto(): Observable<void> {
    return this.api.removeMyPhoto().pipe(tap(() => {
      const profile = this.profileSignal();
      if (profile) this.profileSignal.set(new Profile({ ...profile, hasPhoto: false, photoUpdatedAt: null }));
      this.setPhotoUrl(null);
    }));
  }

  /**
   * Profile and photo of a staff member of the laboratory; only the quality manager can read them.
   *
   * @remarks
   * If the photo cannot be downloaded, the profile is still returned without it.
   *
   * @param laboratoryId - Numeric id of the laboratory
   * @param staffId - Numeric id of the staff member
   * @returns Observable emitting the profile and the object URL of its photo (the caller must revoke it)
   */
  staffProfile(laboratoryId: number, staffId: number): Observable<StaffProfile> {
    return this.api.getStaffProfile(laboratoryId, staffId).pipe(
      switchMap((profile): Observable<StaffProfile> => !profile.hasPhoto
        ? of({ profile, photoUrl: null })
        : this.api.getStaffPhoto(laboratoryId, staffId).pipe(
          map((blob) => ({ profile, photoUrl: URL.createObjectURL(blob) })),
          catchError(() => of({ profile, photoUrl: null })),
        )),
    );
  }

  /** Downloads the photo of the signed-in user and keeps it as an object URL. */
  private loadPhoto(): void {
    this.api.getMyPhoto().subscribe({
      next: (blob) => this.setPhotoUrl(URL.createObjectURL(blob)),
      error: () => this.setPhotoUrl(null),
    });
  }

  /**
   * Replaces the object URL of the photo, revoking the previous one to free its memory.
   *
   * @param url - New object URL, or null to show the initials
   */
  private setPhotoUrl(url: string | null): void {
    const previous = this.photoUrlSignal();
    if (previous) URL.revokeObjectURL(previous);
    this.photoUrlSignal.set(url);
  }

  /** Forgets the profile and photo of the previous user. */
  private reset(): void {
    this.loadedFor = null;
    this.profileSignal.set(null);
    this.errorSignal.set(false);
    this.setPhotoUrl(null);
  }
}

/**
 * Trims an optional text field.
 *
 * @param value - Text typed by the user
 * @returns The trimmed text, or null if it is blank
 */
function blankToNull(value: string): string | null {
  const trimmed = value?.trim() ?? '';
  return trimmed.length === 0 ? null : trimmed;
}
