import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { LaboratoryStore } from '../../../application/laboratory.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { StaffMember } from '../../../domain/model/staff-member.entity';

/**
 * Component responsible for displaying and managing laboratory staff members.
 *
 * @remarks
 * This presentation component loads staff members for the current laboratory. Quality managers
 * register and deactivate them, and open the activity history of each one from their name.
 */
@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [
    RouterLink,
    TranslateModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  templateUrl: './staff-list.html',
  styleUrl: './staff-list.css',
})
export class StaffList implements OnInit {
  /**
   * Store that manages Laboratory bounded context state.
   */
  protected readonly store = inject(LaboratoryStore);

  /**
   * Store that exposes authenticated user context.
   */
  protected readonly iamStore = inject(IamStore);

  /**
   * Router used to navigate after user actions.
   */
  private readonly router = inject(Router);

  /**
   * Translation service used for the deactivation confirmation.
   */
  private readonly translate = inject(TranslateService);

  /**
   * Reference used to stop the deactivation requests when the view is destroyed.
   */
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Translation key of the last failed action.
   */
  protected readonly error = signal<string | null>(null);

  /**
   * Quality managers and auditors can open the activity history of a staff member.
   */
  protected readonly canSeeActivity = computed(() => this.iamStore.canManageQuality() || this.iamStore.isAuditor());

  /**
   * Columns displayed in the staff table; the actions are only shown to quality managers.
   */
  protected readonly displayedColumns = computed(() => {
    const columns = ['fullName', 'role', 'accessRole', 'email', 'active'];
    return this.iamStore.canManageQuality() ? [...columns, 'actions'] : columns;
  });

  /**
   * Lifecycle hook that loads staff members for the current laboratory.
   */
  ngOnInit(): void {
    this.store.loadStaff(this.iamStore.requireLaboratoryId());
  }

  /**
   * Navigates to the staff registration form.
   */
  protected onRegister(): void {
    void this.router.navigate(['/laboratories/staff-form']);
  }

  /**
   * Deactivates a staff member after user confirmation; they can no longer sign in.
   *
   * @param member - Staff member to deactivate
   */
  protected onDeactivate(member: StaffMember): void {
    if (!confirm(this.translate.instant('staff-list.deactivate-confirm', { name: member.fullName }))) return;
    this.error.set(null);
    this.store.deactivateStaff(this.iamStore.requireLaboratoryId(), member.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => this.error.set('staff-list.deactivate-error') });
  }
}
