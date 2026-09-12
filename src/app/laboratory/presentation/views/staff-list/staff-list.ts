import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';

import { LaboratoryStore } from '../../../application/laboratory.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { MatTooltipModule } from '@angular/material/tooltip';

/**
 * Component responsible for displaying and managing laboratory staff members.
 *
 * @remarks
 * This presentation component loads staff members for the current laboratory,
 * allows navigation to the registration form, and delegates deactivation to
 * the Laboratory store.
 */
@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [
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
   * Router used to navigate to staff registration.
   */
  private readonly router = inject(Router);

  /**
   * Columns displayed in the staff table.
   */
  protected readonly displayedColumns = ['fullName', 'role', 'email', 'active', 'actions'];

  /**
   * Retrieves the current laboratory ID from the authenticated context.
   */
  private get currentLaboratoryId(): number {
    return this.iamStore.requireLaboratoryId();
  }

  /**
   * Lifecycle hook that loads staff members for the current laboratory.
   */
  ngOnInit(): void {
    this.store.loadStaff(this.currentLaboratoryId);
  }

  /**
   * Navigates to the staff registration form.
   */
  protected onRegister(): void {
    this.router.navigate(['/laboratories/staff-form']);
  }

  /**
   * Deactivates a staff member after user confirmation.
   *
   * @param staffId - Numeric identifier of the staff member to deactivate
   */
  protected onDeactivate(staffId: number): void {
    if (confirm('Are you sure you want to deactivate this staff member?')) {
      this.store.deactivateStaff(this.currentLaboratoryId, staffId);
    }
  }
}
