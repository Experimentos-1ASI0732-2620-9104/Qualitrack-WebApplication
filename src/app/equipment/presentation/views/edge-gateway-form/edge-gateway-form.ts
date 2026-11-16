import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '@ngx-translate/core';

import { EquipmentStore } from '../../../application/equipment.store';
import { codeValidator } from '../../../../shared/presentation/validators/code.validator';
import { notBlankValidator } from '../../../../shared/presentation/validators/not-blank.validator';

/**
 * Component that registers an Edge Gateway and, optionally, the environment where it is installed.
 *
 * @remarks
 * The Edge Gateway is the station that receives the readings of the IoT devices of an environment
 * and sends them to the cloud. An environment can keep several gateways, so no environment is
 * shown as occupied. The API key of the gateway is generated afterwards, from its detail, once it
 * is located in an environment.
 */
@Component({
  selector: 'app-edge-gateway-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterModule,
    TranslatePipe,
  ],
  templateUrl: './edge-gateway-form.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './edge-gateway-form.css',
})
export class EdgeGatewayForm implements OnInit {
  /**
   * Builder of the registration form.
   */
  private readonly fb = inject(FormBuilder);

  /**
   * Router used to open the detail of the registered gateway.
   */
  private readonly router = inject(Router);

  /**
   * Store that manages the equipment of the current laboratory.
   */
  protected readonly store = inject(EquipmentStore);

  /**
   * Registration form, with the same limits the platform validates.
   */
  protected readonly form = this.fb.group({
    name: this.fb.nonNullable.control('', [
      Validators.required,
      notBlankValidator,
      Validators.minLength(3),
      Validators.maxLength(150),
    ]),
    sensorExternalId: this.fb.nonNullable.control('', [
      Validators.required,
      notBlankValidator,
      codeValidator,
      Validators.maxLength(50),
    ]),
    serialNumber: this.fb.nonNullable.control('', [
      Validators.required,
      notBlankValidator,
      codeValidator,
      Validators.maxLength(50),
    ]),
    model: this.fb.nonNullable.control('Raspberry Pi 4', [
      Validators.required,
      notBlankValidator,
      Validators.maxLength(100),
    ]),
    environmentId: this.fb.control<number | null>(readEnvironmentId(inject(ActivatedRoute))),
  });

  constructor() {
    this.store.clearMessages();
  }

  /**
   * Lifecycle hook that loads the environments offered to locate the gateway.
   */
  ngOnInit(): void {
    void this.store.loadEnvironments();
  }

  /**
   * Registers the Edge Gateway and opens its detail.
   *
   * @remarks
   * A gateway whose association with the environment failed is still registered: its detail
   * explains why and lets it be located again.
   */
  protected async onSave(): Promise<void> {
    // The button stays usable; pressing it with something missing points at what is missing
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { environmentId, ...command } = this.form.getRawValue();
    const gateway = await this.store.registerEdgeGateway(command, environmentId);
    if (!gateway) return;
    const locationError =
      environmentId !== null && gateway.environmentId === null ? this.store.error() : null;
    await this.router.navigate(['/equipments', gateway.id], {
      state: { locationError },
    });
  }
}

/**
 * Reads the environment the form opens with, from the `environmentId` query parameter.
 *
 * @param route - The active route
 * @returns The identifier of the environment, or `null` if the parameter is missing or is not a positive integer
 */
function readEnvironmentId(route: ActivatedRoute): number | null {
  const value = Number(route.snapshot.queryParamMap.get('environmentId'));
  return Number.isInteger(value) && value > 0 ? value : null;
}
