import { Component, DestroyRef, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { catchError, of, switchMap } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IamStore } from '../../../../iam/application/iam.store';
import { LaboratoryStore } from '../../../application/laboratory.store';
import { StaffMember } from '../../../domain/model/staff-member.entity';

/** Laboratory staff data and deactivation, with links to the profile and activity owned by their contexts. */
@Component({
  selector: 'app-staff-detail',
  standalone: true,
  imports: [RouterLink, TranslatePipe, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './staff-detail.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './staff-detail.css',
})
export class StaffDetail {
  protected readonly iam = inject(IamStore);
  private readonly route = inject(ActivatedRoute);
  private readonly laboratoryStore = inject(LaboratoryStore);
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly member = signal<StaffMember | null>(null);
  protected readonly deactivating = signal(false);

  constructor() {
    this.route.paramMap.pipe(
      switchMap((params) => {
        this.loading.set(true);
        this.error.set(null);
        this.member.set(null);
        const staffId = Number(params.get('staffId'));
        if (!Number.isSafeInteger(staffId) || staffId <= 0) return of(null);
        return this.laboratoryStore.staffMember(this.iam.requireLaboratoryId(), staffId)
          .pipe(catchError(() => of(null)));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((member) => {
      this.member.set(member);
      this.loading.set(false);
      if (!member) this.error.set('staff.detail.load-error');
    });
  }

  /**
   * Deactivates the staff member after user confirmation; they can no longer sign in.
   *
   * @param member - Staff member to deactivate
   */
  protected deactivate(member: StaffMember): void {
    if (
      !confirm(this.translate.instant('staff-list.deactivate-confirm', { name: member.fullName }))
    )
      return;
    this.deactivating.set(true);
    this.error.set(null);
    this.laboratoryStore
      .deactivateStaff(member.laboratoryId, member.id)
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
