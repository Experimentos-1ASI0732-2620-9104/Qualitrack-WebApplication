import { Component, DestroyRef, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { catchError, of, switchMap } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IamStore } from '../../../../iam/application/iam.store';
import { ProfileStore, StaffProfile } from '../../../application/profile.store';
import { DateTimePipe } from '../../../../shared/presentation/pipes/date-time.pipe';

/** Personal data of a staff member, available only to quality managers through the route guard. */
@Component({
  selector: 'app-staff-profile',
  standalone: true,
  imports: [DateTimePipe, RouterLink, TranslatePipe, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './staff-profile.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './staff-profile.css',
})
export class StaffProfilePage {
  private readonly route = inject(ActivatedRoute);
  private readonly iam = inject(IamStore);
  private readonly profiles = inject(ProfileStore);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly staffId = signal<number | null>(null);
  protected readonly loading = signal(true);
  protected readonly profile = signal<StaffProfile | null>(null);

  constructor() {
    this.destroyRef.onDestroy(() => this.showProfile(null));
    this.route.paramMap.pipe(
      switchMap((params) => {
        this.showProfile(null);
        this.loading.set(true);
        const staffId = Number(params.get('staffId'));
        const valid = Number.isSafeInteger(staffId) && staffId > 0;
        this.staffId.set(valid ? staffId : null);
        if (!valid) return of(null);
        return this.profiles.staffProfile(this.iam.requireLaboratoryId(), staffId)
          .pipe(catchError(() => of(null)));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((profile) => {
      this.showProfile(profile);
      this.loading.set(false);
    });
  }

  /** Releases the previous object URL whenever the route changes or the page is destroyed. */
  private showProfile(profile: StaffProfile | null): void {
    const previous = this.profile()?.photoUrl;
    if (previous) URL.revokeObjectURL(previous);
    this.profile.set(profile);
  }
}
