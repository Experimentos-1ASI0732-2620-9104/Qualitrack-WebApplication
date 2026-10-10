import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '@ngx-translate/core';

import { EquipmentStore } from '../../../application/equipment.store';

/**
 * Registers an equipment of the laboratory (US45). IoT devices are registered with the device form.
 */
@Component({
  selector: 'app-equipment-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    RouterModule,
    TranslatePipe,
  ],
  templateUrl: './equipment-form.html',
  styleUrl: './equipment-form.css',
})
export class EquipmentForm {
  private readonly fb = inject(FormBuilder);

  private readonly router = inject(Router);

  protected readonly store = inject(EquipmentStore);

  /** Common laboratory equipment categories offered as suggestions; the type is free text in the platform. */
  protected readonly equipmentTypes = [
    'Autoclave',
    'Centrifuge',
    'Incubator',
    'Mixer',
    'Refrigerator',
    'HPLC System',
  ];

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]],
    type: ['', [Validators.required, Validators.maxLength(100)]],
    model: ['', [Validators.required, Validators.maxLength(100)]],
    serialNumber: ['', [Validators.required, Validators.maxLength(50), Validators.pattern(/^[a-zA-Z0-9-]+$/)]],
  });

  constructor() {
    this.store.clearMessages();
  }

  protected async onSave(): Promise<void> {
    if (this.form.invalid) return;
    const equipment = await this.store.registerEquipment(this.form.getRawValue());
    if (equipment) await this.router.navigate(['/equipments/equipment-detail', equipment.id]);
  }
}
