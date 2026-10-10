import {
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { BatchStore, batchError } from '../../../application/batch.store';
import { BatchPath } from '../../../infrastructure/batch-api-endpoint';
import { EquipmentApi } from '../../../../equipment/infrastructure/equipment-api';
import { Equipment } from '../../../../equipment/domain/model/equipment.entity';
import { LaboratoryApi } from '../../../../laboratory/infrastructure/laboratory-api';
import { StaffMember } from '../../../../laboratory/domain/model/staff-member.entity';
import { IamStore } from '../../../../iam/application/iam.store';

/**
 * Equipment and staff that took part in a batch, with the association forms while it is open.
 *
 * @remarks
 * Only operational equipment can be selected; the backend rejects equipment in maintenance or out of
 * service and associations that already exist. Quality managers can assign any staff member; an operator
 * can only assign themselves.
 *
 * @author Qualitrack
 */
@Component({
  selector: 'app-batch-participants',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    TranslateModule,
  ],
  templateUrl: './batch-participants.html',
  styleUrl: '../../../../shared/presentation/styles/operations-page.css',
})
export class BatchParticipants implements OnInit {
  /** Laboratory, environment and product of the batch. */
  readonly path = input.required<BatchPath>();
  /** Identifier of the batch. */
  readonly batchId = input.required<number>();
  /** Whether the batch is still open to new participants. */
  readonly open = input(false);
  protected readonly store = inject(BatchStore);
  private readonly equipmentApi = inject(EquipmentApi);
  private readonly laboratoryApi = inject(LaboratoryApi);
  protected readonly iam = inject(IamStore);

  /** Equipment of the laboratory. */
  protected readonly equipment = signal<Equipment[]>([]);
  /** Staff members of the laboratory. */
  protected readonly staff = signal<StaffMember[]>([]);
  /** Translation key or server message of the failure to load equipment and staff; null when there is none. */
  protected readonly loadError = signal<string | null>(null);
  /** Identifier of the equipment selected in the form; null while none is selected. */
  protected equipmentId: number | null = null;
  /** Identifier of the staff member selected in the form; null while none is selected. */
  protected staffId: number | null = null;

  /** Operational process equipment not associated with the batch yet; IoT devices only monitor conditions. */
  protected readonly availableEquipment = computed(() => {
    const used = new Set(
      (this.store.traceability()?.equipment ?? []).map((usage) => usage.equipmentId),
    );
    return this.equipment().filter(
      (item) => !item.isIotDevice && item.status === 'OPERATIONAL' && !used.has(item.id),
    );
  });

  /** Active staff members not associated with the batch yet. */
  protected readonly availableStaff = computed(() => {
    const joined = new Set(
      (this.store.traceability()?.staff ?? []).map((participation) => participation.staffId),
    );
    return this.staff().filter((member) => member.assignable && !joined.has(member.id));
  });

  /** Staff record of the signed-in operator, who can only assign themselves to the batch. */
  protected readonly ownStaffMember = computed(
    () => this.staff().find((member) => member.userId === this.iam.currentUserId()) ?? null,
  );

  /** Whether the signed-in operator already takes part in the batch. */
  protected readonly ownParticipation = computed(() => {
    const member = this.ownStaffMember();
    return (
      member !== null &&
      (this.store.traceability()?.staff ?? []).some((item) => item.staffId === member.id)
    );
  });

  /** Forms are only shown on open batches and to users who register operations (not auditors). */
  protected readonly editable = computed(() => this.open() && this.iam.canOperate());

  /**
   * Lifecycle hook that loads the equipment and staff of the laboratory when the forms are editable.
   */
  async ngOnInit(): Promise<void> {
    if (!this.editable()) return;
    const laboratoryId = this.iam.requireLaboratoryId();
    try {
      const [equipment, staff] = await Promise.all([
        firstValueFrom(this.equipmentApi.getEquipment(laboratoryId)),
        firstValueFrom(this.laboratoryApi.getStaff(laboratoryId)),
      ]);
      this.equipment.set(equipment.filter((item) => item.labId === laboratoryId));
      this.staff.set(staff);
    } catch (error) {
      this.loadError.set(batchError(error));
    }
  }

  /**
   * Associates the selected equipment with the batch and clears the selection on success.
   */
  protected async addEquipment(): Promise<void> {
    if (this.equipmentId === null) return;
    if (await this.store.registerEquipment(
      this.path(),
      this.batchId(),
      this.equipmentId
    ))
      this.equipmentId = null;
  }

  /**
   * Associates the selected staff member with the batch and clears the selection on success.
   */
  protected async addStaff(): Promise<void> {
    if (this.staffId === null) return;
    if (await this.store.registerStaff(this.path(), this.batchId(), this.staffId))
      this.staffId = null;
  }

  /**
   * Associates the signed-in operator with the batch.
   *
   * @param member - The staff record of the signed-in operator.
   */
  protected async assignMyself(member: StaffMember): Promise<void> {
    await this.store.registerStaff(this.path(), this.batchId(), member.id);
  }
}
