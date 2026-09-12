import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { RegisterMaintenanceCommand } from '../../../domain/model/register-maintenance.command';

/**
 * Component responsible for displaying and handling the maintenance registration form.
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
  protected readonly equipmentId = signal<number | null>(null);

  protected readonly maintenanceTypes = [
    { value: 'PREVENTIVE', label: 'Preventive' },
    { value: 'CORRECTIVE', label: 'Corrective' },
    { value: 'CALIBRATION', label: 'Calibration' },
    { value: 'INSPECTION', label: 'Inspection' },
  ];

  protected form: FormGroup = this.fb.group({
    maintenanceDate: [new Date(), Validators.required],
    technicianName: ['', [Validators.required, Validators.minLength(3)]],
    type: ['', Validators.required],
    description: ['', [Validators.required, Validators.maxLength(500)]],
  });

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      this.equipmentId.set(Number(idParam));
    }
  }

  protected onSave(): void {
    const equipmentId = this.equipmentId();

    if (this.form.invalid || !equipmentId) return;

    const formValue = this.form.getRawValue();

    const command: RegisterMaintenanceCommand = {
      equipmentId,
      maintenanceDate: this.toLocalDateString(formValue.maintenanceDate),
      technicianName: formValue.technicianName,
      type: formValue.type,
      description: formValue.description,
    };

    this.store.registerMaintenance(command);
    this.router.navigate(['/equipments/equipment-detail', equipmentId]).then();
  }

  private toLocalDateString(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
