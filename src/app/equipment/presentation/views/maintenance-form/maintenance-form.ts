import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '@ngx-translate/core';

import { EquipmentStore } from '../../../application/equipment.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { LaboratoryApi } from '../../../../laboratory/infrastructure/laboratory-api';
import { StaffMember } from '../../../../laboratory/domain/model/staff-member.entity';
import { localIsoDate } from '../../../../shared/presentation/utils/local-date';

/**
 * Registers a maintenance performed on an equipment located in an environment (US49).
 */
@Component({
  selector: 'app-maintenance-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    RouterModule,
    TranslatePipe,
  ],
  templateUrl: './maintenance-form.html',
  styleUrl: './maintenance-form.css',
})
export class MaintenanceForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly store = inject(EquipmentStore);
  private readonly iam = inject(IamStore);
  private readonly laboratoryApi = inject(LaboratoryApi);

  /** Staff of the laboratory that can perform maintenance: active operators with an account. */
  private readonly staff = signal<StaffMember[]>([]);
  protected readonly staffLoaded = signal(false);

  /**
   * Technicians the user can choose: a quality manager chooses any operator; an operator only
   * registers the maintenance they performed.
   */
  protected readonly technicians = computed(() => {
    const assignable = this.staff().filter((member) => member.assignable);
    if (this.iam.canManageQuality()) return assignable;
    return assignable.filter((member) => member.userId === this.iam.currentUserId());
  });
  protected readonly equipmentId = signal<number | null>(null);
  protected readonly equipment = computed(() => {
    const selected = this.store.selectedEquipment();
    return selected?.id === this.equipmentId() ? selected : null;
  });

  /** A performed maintenance cannot be dated in the future. */
  protected readonly today = new Date();

  protected readonly maintenanceTypes = ['PREVENTIVE', 'CORRECTIVE', 'CALIBRATION', 'INSPECTION', 'OTHER'];

  protected readonly form = this.fb.nonNullable.group({
    maintenanceDate: [new Date(), Validators.required],
    technicianStaffId: [null as number | null, Validators.required],
    type: ['', Validators.required],
    description: ['', [Validators.required, Validators.maxLength(1000)]],
  });

  constructor() {
    this.store.clearMessages();
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isSafeInteger(id) || id <= 0) return;
    this.equipmentId.set(id);
    if (!this.equipment()) void this.store.loadEquipmentById(id);
    this.laboratoryApi.getStaff(this.iam.requireLaboratoryId()).subscribe({
      next: (staff) => {
        this.staff.set(staff);
        this.staffLoaded.set(true);
        const technicians = this.technicians();
        if (!this.iam.canManageQuality() && technicians.length === 1) {
          this.form.controls.technicianStaffId.setValue(technicians[0].id);
        }
      },
      error: () => this.staffLoaded.set(true),
    });
  }

  protected async onSave(): Promise<void> {
    const equipment = this.equipment();
    if (this.form.invalid || !equipment) return;
    const { maintenanceDate, technicianStaffId, ...values } = this.form.getRawValue();
    if (technicianStaffId === null) return;
    const saved = await this.store.registerMaintenance(equipment, {
      ...values,
      technicianStaffId,
      maintenanceDate: localIsoDate(new Date(maintenanceDate)),
    });
    if (saved) await this.router.navigate(['/equipments/equipment-detail', equipment.id]);
  }
}
