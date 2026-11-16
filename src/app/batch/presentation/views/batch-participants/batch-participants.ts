import {
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe } from '@ngx-translate/core';
import { BatchStore, batchError } from '../../../application/batch.store';
import { BatchPath } from '../../../domain/model/batch-path';
import { ProductionEquipment } from '../../../domain/model/production-equipment.entity';
import { ProductionStaffMember } from '../../../domain/model/production-staff-member.entity';
import { IamStore } from '../../../../iam/application/iam.store';
import { DateTimePipe } from '../../../../shared/presentation/pipes/date-time.pipe';
import { TablePaginator, paginate } from '../../../../shared/presentation/components/table-paginator/table-paginator';

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
    TablePaginator, DateTimePipe,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    TranslatePipe,
  ],
  templateUrl: './batch-participants.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './batch-participants.css',
})
export class BatchParticipants implements OnInit {
  /** Page of the table shown; ten rows unless the person chooses more. */
  protected readonly staffPage = paginate(() => this.store.traceability()?.staff ?? []);

  /** Page of the table shown; ten rows unless the person chooses more. */
  protected readonly equipmentPage = paginate(() => this.store.traceability()?.equipment ?? []);

  /** Laboratory, environment and product of the batch. */
  readonly path = input.required<BatchPath>();
  /** Identifier of the batch. */
  readonly batchId = input.required<number>();
  /** Whether the batch is still open to new participants. */
  readonly open = input(false);
  protected readonly store = inject(BatchStore);
  protected readonly iam = inject(IamStore);

  /** Equipment of the laboratory. */
  protected readonly equipment = signal<ProductionEquipment[]>([]);
  /** Staff members of the laboratory. */
  protected readonly staff = signal<ProductionStaffMember[]>([]);
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
      (item) => !item.isIotDevice && item.isOperational && !used.has(item.id),
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
    try {
      const [equipment, staff] = await Promise.all([
        this.store.loadProductionEquipment(),
        this.store.loadStaff(),
      ]);
      this.equipment.set(equipment);
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
    if (await this.store.registerEquipment(this.path(), this.batchId(), this.equipmentId))
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
  protected async assignMyself(member: ProductionStaffMember): Promise<void> {
    await this.store.registerStaff(this.path(), this.batchId(), member.id);
  }
}
