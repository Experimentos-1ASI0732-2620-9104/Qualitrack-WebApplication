import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { catchError, forkJoin, of, switchMap } from 'rxjs';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { IamStore } from '../../../../iam/application/iam.store';
import { LaboratoryApi } from '../../../infrastructure/laboratory-api';
import { LaboratoryStore } from '../../../application/laboratory.store';
import { StaffMember } from '../../../domain/model/staff-member.entity';
import { RaApi } from '../../../../ra/infrastructure/ra-api';
import { AuditLogEntry } from '../../../../ra/domain/model/audit-log-entry.entity';
import { ProfileStore, StaffProfile } from '../../../../profile/application/profile.store';

/**
 * Records whose type has a translated name; any other type is shown as the platform sends it.
 */
const KNOWN_ENTITIES = new Set([
  'BATCH', 'BPM_PARAMETER_CONFIG', 'DEVIATION_ALERT', 'ENVIRONMENT', 'EQUIPMENT', 'EQUIPMENT_TELEMETRY_STATUS',
  'ENVIRONMENTAL_PROFILE', 'LABORATORY', 'MAINTENANCE_RECORD', 'NOTIFICATION_PREFERENCE', 'PHARMACEUTICAL_PRODUCT', 'RAW_MATERIAL',
  'RAW_MATERIAL_BATCH', 'RAW_MATERIAL_USAGE', 'STAFF_MEMBER', 'TELEMETRY_ANOMALY', 'TELEMETRY_HISTORY_POINT',
  'TELEMETRY_MEASUREMENT',
]);

/**
 * Actions with a translated name; any other action is shown as the platform sends it.
 */
const KNOWN_ACTIONS = new Set([
  'CREATE', 'UPDATE', 'DELETE', 'RELEASE', 'REJECT', 'APPROVE', 'REGISTER', 'REMOVE', 'EXPORT', 'GENERATE',
]);

/**
 * Profile of a staff member and what they did with their account (maintenance, receipts, batches…),
 * consulted by quality managers and auditors from the staff list.
 *
 * @remarks
 * Only the quality manager sees the photo and the personal data the staff member keeps in the
 * profile, and can deactivate the staff member. The activity can be filtered by record type.
 */
@Component({
  selector: 'app-staff-detail',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    TranslateModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './staff-detail.html',
  styleUrls: ['../../../../shared/presentation/styles/operations-page.css', './staff-detail.css'],
})
export class StaffDetail {
  /**
   * Store that exposes the authenticated session and its permissions.
   */
  protected readonly iam = inject(IamStore);

  /**
   * Current route, which carries the identifier of the staff member.
   */
  private readonly route = inject(ActivatedRoute);

  /**
   * Laboratory API facade used to read the staff member.
   */
  private readonly laboratoryApi = inject(LaboratoryApi);

  /**
   * Store used to deactivate the staff member.
   */
  private readonly laboratoryStore = inject(LaboratoryStore);

  /**
   * API facade of Reporting and Analysis used to read the audit log of the staff member.
   */
  private readonly raApi = inject(RaApi);

  /**
   * Store used to read the profile the staff member keeps.
   */
  private readonly profiles = inject(ProfileStore);

  /**
   * Translation service used for the deactivation confirmation.
   */
  private readonly translate = inject(TranslateService);

  /**
   * Reference used to stop subscriptions and release the profile photo on destroy.
   */
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Indicates whether the staff member and their activity are being loaded.
   */
  protected readonly loading = signal(true);

  /**
   * Translation key of the latest error, if any.
   */
  protected readonly error = signal<string | null>(null);

  /**
   * Staff member shown, or `null` when it could not be loaded.
   */
  protected readonly member = signal<StaffMember | null>(null);

  /**
   * Activity of the staff member, newest first.
   */
  protected readonly activity = signal<AuditLogEntry[]>([]);

  /**
   * Record type used to filter the activity; `'ALL'` shows every record.
   */
  protected readonly entityFilter = signal<string>('ALL');

  /**
   * Indicates whether the staff member is being deactivated.
   */
  protected readonly deactivating = signal(false);

  /**
   * Profile the staff member keeps, only loaded for quality managers.
   */
  protected readonly profile = signal<StaffProfile | null>(null);

  /**
   * Indicates whether the profile of the staff member could not be loaded.
   */
  protected readonly profileUnavailable = signal(false);

  /**
   * Record types present in the activity, in alphabetical order.
   */
  protected readonly entityTypes = computed(() =>
    [...new Set(this.activity().map((entry) => entry.entityType))].sort());

  /**
   * Activity that matches the selected record type.
   */
  protected readonly visibleActivity = computed(() => {
    const filter = this.entityFilter();
    return filter === 'ALL' ? this.activity() : this.activity().filter((entry) => entry.entityType === filter);
  });

  /**
   * Timestamp of the most recent activity, or `null` when there is none.
   */
  protected readonly lastActivity = computed(() => this.activity()[0]?.timestamp ?? null);

  /**
   * Creates the view and loads the staff member and their activity for every staff identifier
   * in the route.
   */
  constructor() {
    this.destroyRef.onDestroy(() => this.showProfile(null));
    this.route.paramMap.pipe(
      switchMap((params) => {
        this.loading.set(true);
        this.error.set(null);
        const staffId = Number(params.get('staffId'));
        if (!Number.isSafeInteger(staffId) || staffId <= 0) return of(null);
        const laboratoryId = this.iam.requireLaboratoryId();
        return forkJoin({
          member: this.laboratoryApi.getStaffMember(laboratoryId, staffId),
          activity: this.raApi.getStaffActivity(laboratoryId, staffId),
        }).pipe(catchError(() => of(null)));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((result) => {
      this.loading.set(false);
      this.entityFilter.set('ALL');
      if (!result) {
        this.member.set(null);
        this.activity.set([]);
        this.error.set('staff.detail.load-error');
        return;
      }
      this.member.set(result.member);
      this.activity.set([...result.activity].sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
      this.loadProfile(result.member);
    });
  }

  /**
   * Loads the profile the staff member keeps: photo and personal data.
   *
   * @remarks
   * Only quality managers see it, and only for staff members with an account.
   *
   * @param member - Staff member whose profile is loaded
   */
  private loadProfile(member: StaffMember): void {
    this.showProfile(null);
    this.profileUnavailable.set(false);
    if (!this.iam.canManageQuality() || member.userId === null) return;
    this.profiles.staffProfile(member.laboratoryId, member.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => this.showProfile(profile),
        error: () => this.profileUnavailable.set(true),
      });
  }

  /**
   * Shows a profile and releases the photo of the previous one.
   *
   * @param profile - Profile to show, or `null` to clear it
   */
  private showProfile(profile: StaffProfile | null): void {
    const previous = this.profile()?.photoUrl;
    if (previous) URL.revokeObjectURL(previous);
    this.profile.set(profile);
  }

  /**
   * Returns the translation key of a record type.
   *
   * @param entityType - Record type sent by the platform
   * @returns Translation key, or `null` when the type has no translated name
   */
  protected entityKey(entityType: string): string | null {
    return KNOWN_ENTITIES.has(entityType) ? `staff.activity.entities.${entityType.toLowerCase()}` : null;
  }

  /**
   * Returns the translation key of an action.
   *
   * @param action - Action sent by the platform
   * @returns Translation key, or `null` when the action has no translated name
   */
  protected actionKey(action: string): string | null {
    return KNOWN_ACTIONS.has(action) ? `staff.activity.actions.${action.toLowerCase()}` : null;
  }

  /**
   * Deactivates the staff member after user confirmation; they can no longer sign in.
   *
   * @param member - Staff member to deactivate
   */
  protected deactivate(member: StaffMember): void {
    if (!confirm(this.translate.instant('staff-list.deactivate-confirm', { name: member.fullName }))) return;
    this.deactivating.set(true);
    this.error.set(null);
    this.laboratoryStore.deactivateStaff(member.laboratoryId, member.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (deactivated) => {
          this.member.set(deactivated);
          this.deactivating.set(false);
        },
        error: () => {
          this.error.set('staff-list.deactivate-error');
          this.deactivating.set(false);
        },
      });
  }
}
