import { Component, OnInit, inject } from '@angular/core';
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
import { IOT_DEVICE_TYPES, IotDeviceType } from '../../../domain/model/iot-device-type';
import { EnvironmentStore } from '../../../../laboratory/application/environment.store';

/**
 * Registers an ESP32 environmental device or container monitor and, optionally, the environment
 * where it is installed (US51-US54).
 */
@Component({
  selector: 'app-device-form',
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
  templateUrl: './device-form.html',
  styleUrl: '../equipment-form/equipment-form.css',
})
export class DeviceForm implements OnInit {
  private readonly fb = inject(FormBuilder);

  private readonly router = inject(Router);

  protected readonly store = inject(EquipmentStore);

  protected readonly environments = inject(EnvironmentStore);

  protected readonly deviceTypes = IOT_DEVICE_TYPES;

  protected readonly form = this.fb.group({
    deviceType: this.fb.nonNullable.control<IotDeviceType>('ENVIRONMENTAL_DEVICE', Validators.required),
    name: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(3), Validators.maxLength(150)]),
    sensorExternalId: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(50)]),
    serialNumber: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(50)]),
    model: this.fb.nonNullable.control('ESP32', [Validators.required, Validators.maxLength(100)]),
    firmwareVersion: this.fb.control<string | null>(null, Validators.maxLength(50)),
    environmentId: this.fb.control<number | null>(null),
  });

  constructor() {
    this.store.clearMessages();
  }

  ngOnInit(): void {
    void this.environments.loadEnvironments();
    this.store.loadEquipment();
  }

  /** An environment keeps a single environmental device (US52). */
  protected isOccupied(environmentId: number): boolean {
    return this.form.controls.deviceType.value === 'ENVIRONMENTAL_DEVICE' && this.store.iotDevices().some((device) =>
      device.deviceType === 'ENVIRONMENTAL_DEVICE' && device.environmentId === environmentId);
  }

  protected async onSave(): Promise<void> {
    if (this.form.invalid) return;
    const { environmentId, ...command } = this.form.getRawValue();
    const device = await this.store.registerDevice(command, environmentId);
    if (!device) return;
    // A device whose association failed is still registered: its detail explains why and lets it be located again.
    const locationError = environmentId !== null && device.environmentId === null ? this.store.error() : null;
    await this.router.navigate(['/equipments/equipment-detail', device.id], { state: { locationError } });
  }
}
