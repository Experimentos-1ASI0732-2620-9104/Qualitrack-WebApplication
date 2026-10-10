import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '@ngx-translate/core';

import { EquipmentStore } from '../../../application/equipment.store';
import { Equipment } from '../../../domain/model/equipment.entity';
import { EQUIPMENT_STATUSES, EquipmentStatus } from '../../../domain/model/equipment-status';
import { EnvironmentStore } from '../../../../laboratory/application/environment.store';

/**
 * Technical file of an equipment or IoT device: identity, location, operational status,
 * BPM limits and maintenance history (US46-US50).
 */
@Component({
  selector: 'app-equipment-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    RouterModule,
    TranslatePipe,
  ],
  templateUrl: './equipment-detail.html',
  styleUrl: './equipment-detail.css',
})
export class EquipmentDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);

  private readonly fb = inject(FormBuilder);

  protected readonly store = inject(EquipmentStore);

  protected readonly environments = inject(EnvironmentStore);

  protected readonly equipmentId = signal<number | null>(null);

  /** Why the environment chosen when registering a device could not be recorded. */
  protected readonly locationNotice = signal<string | null>(history.state?.locationError ?? null);

  protected readonly equipment = computed(() => {
    const selected = this.store.selectedEquipment();
    return selected?.id === this.equipmentId() ? selected : null;
  });

  protected readonly locationForm = this.fb.group({
    environmentId: this.fb.control<number | null>(null, Validators.required),
  });

  protected readonly statusForm = this.fb.group({
    status: this.fb.control<EquipmentStatus | null>(null, Validators.required),
    reason: this.fb.control<string | null>(null, Validators.maxLength(500)),
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isSafeInteger(id) || id <= 0) return;
    this.equipmentId.set(id);
    void this.environments.loadEnvironments();
    this.store.loadEquipment();
    this.store.loadBpmConfig(id);
    void this.load(id);
  }

  /** Statuses the equipment can change to; the current status is not a change. */
  protected statusOptions(equipment: Equipment): EquipmentStatus[] {
    return EQUIPMENT_STATUSES.filter((status) => status !== equipment.status);
  }

  protected environmentName(environmentId: number | null): string | null {
    if (environmentId === null) return null;
    const environment = this.environments.environments().find((item) => item.id === environmentId);
    return environment ? `${environment.code} - ${environment.name}` : `#${environmentId}`;
  }

  /** An environment keeps a single environmental device (US52). */
  protected isOccupied(equipment: Equipment, environmentId: number): boolean {
    return equipment.deviceType === 'ENVIRONMENTAL_DEVICE' && this.store.iotDevices().some((device) =>
      device.id !== equipment.id && device.deviceType === 'ENVIRONMENTAL_DEVICE' && device.environmentId === environmentId);
  }

  protected async onLocate(equipment: Equipment): Promise<void> {
    const environmentId = this.locationForm.controls.environmentId.value;
    if (environmentId === null || environmentId === equipment.environmentId) return;
    const located = await this.store.assignToEnvironment(equipment, environmentId);
    if (!located) return;
    this.locationNotice.set(null);
    this.locationForm.reset();
    await this.store.loadMaintenanceHistory(located);
  }

  protected async onChangeStatus(equipment: Equipment): Promise<void> {
    const { status, reason } = this.statusForm.getRawValue();
    if (this.statusForm.invalid || status === null) return;
    if (await this.store.changeStatus(equipment, { status, reason })) this.statusForm.reset();
  }

  private async load(id: number): Promise<void> {
    const equipment = await this.store.loadEquipmentById(id);
    if (equipment) await this.store.loadMaintenanceHistory(equipment);
  }
}
