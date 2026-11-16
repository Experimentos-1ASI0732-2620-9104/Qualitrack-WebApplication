import {
  Component,
  OnInit,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
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
import { MatDialog } from '@angular/material/dialog';
import { TranslatePipe } from '@ngx-translate/core';

import { EquipmentStore } from '../../../application/equipment.store';
import { Equipment } from '../../../domain/model/equipment.entity';
import { EQUIPMENT_STATUSES, EquipmentStatus } from '../../../domain/model/equipment-status';
import { notBlankValidator } from '../../../../shared/presentation/validators/not-blank.validator';
import { DateOnlyPipe } from '../../../../shared/presentation/pipes/date-only.pipe';
import { EdgeGatewayApiKeyDialog } from '../../components/edge-gateway-api-key-dialog/edge-gateway-api-key-dialog';

/**
 * Technical file of an equipment, IoT device or Edge Gateway: identity, location, operational
 * status, BPM limits and maintenance history (US46-US50).
 *
 * @remarks
 * For an Edge Gateway it also tells whether its API key was already issued and lets a quality
 * manager generate it. The key is shown once in a dialog and is not kept anywhere else. A gateway
 * has no process parameters, so its detail hides the BPM limits.
 */
@Component({
  selector: 'app-equipment-detail',
  standalone: true,
  imports: [DateOnlyPipe,
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
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './equipment-detail.css',
})
export class EquipmentDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);

  private readonly fb = inject(FormBuilder);

  private readonly dialog = inject(MatDialog);

  protected readonly store = inject(EquipmentStore);

  protected readonly equipmentId = signal<number | null>(null);

  /** Why the environment chosen when registering a device could not be recorded. */
  protected readonly locationNotice = signal<string | null>(history.state?.locationError ?? null);

  protected readonly equipment = computed(() => {
    const selected = this.store.selectedEquipment();
    return selected?.id === this.equipmentId() ? selected : null;
  });

  /**
   * Whether the Edge Gateway already has an API key; `null` while it is unknown or when the
   * equipment is not a gateway.
   */
  protected readonly apiKeyIssued = signal<boolean | null>(null);

  protected readonly locationForm = this.fb.group({
    environmentId: this.fb.control<number | null>(null, Validators.required),
  });

  protected readonly statusForm = this.fb.group({
    status: this.fb.control<EquipmentStatus | null>(null, Validators.required),
    reason: this.fb.control<string | null>(null, [notBlankValidator, Validators.maxLength(500)]),
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('equipmentId'));
    if (!Number.isSafeInteger(id) || id <= 0) return;
    this.equipmentId.set(id);
    void this.store.loadEnvironments();
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
    const environment = this.store.environments().find((item) => item.id === environmentId);
    return environment ? `${environment.code} - ${environment.name}` : `#${environmentId}`;
  }

  /** An environment keeps a single environmental device (US52). */
  protected isOccupied(equipment: Equipment, environmentId: number): boolean {
    return (
      equipment.deviceType === 'ENVIRONMENTAL_DEVICE' &&
      this.store
        .iotDevices()
        .some(
          (device) =>
            device.id !== equipment.id &&
            device.deviceType === 'ENVIRONMENTAL_DEVICE' &&
            device.environmentId === environmentId,
        )
    );
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

  /**
   * Tells whether the API key of an Edge Gateway can be generated now.
   *
   * @remarks
   * The platform issues the key only once, for a gateway that is located in an environment and
   * operational.
   *
   * @param equipment - Edge Gateway shown in the detail
   * @returns `true` when the key was not issued yet and the gateway is located and operational
   */
  protected canIssueApiKey(equipment: Equipment): boolean {
    return (
      this.apiKeyIssued() === false && equipment.isLocated && equipment.status === 'OPERATIONAL'
    );
  }

  /**
   * Generates the API key of an Edge Gateway and shows it once in a dialog.
   *
   * @remarks
   * The key goes from the platform straight to the dialog. A rejection of the platform (for
   * example, a key that already exists) is shown as the error of the page.
   *
   * @param equipment - Edge Gateway whose key is generated
   */
  protected async onIssueApiKey(equipment: Equipment): Promise<void> {
    const issued = await this.store.issueEdgeGatewayApiKey(equipment.id);
    if (!issued) {
      this.apiKeyIssued.set(await this.store.loadEdgeGatewayApiKeyStatus(equipment.id));
      return;
    }
    this.apiKeyIssued.set(true);
    this.dialog.open(EdgeGatewayApiKeyDialog, {
      data: issued,
      disableClose: true,
      autoFocus: 'dialog',
      width: '560px',
    });
  }

  private async load(id: number): Promise<void> {
    const equipment = await this.store.loadEquipmentById(id);
    if (!equipment) return;
    // Only a quality manager may read the key status; the platform refuses it to anyone else.
    if (equipment.isEdgeGateway && this.store.canManage()) {
      this.apiKeyIssued.set(await this.store.loadEdgeGatewayApiKeyStatus(id));
    }
    await this.store.loadMaintenanceHistory(equipment);
  }
}
