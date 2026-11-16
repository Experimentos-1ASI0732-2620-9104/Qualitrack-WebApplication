import {
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslatePipe } from '@ngx-translate/core';
import { InventoryStore } from '../../../application/inventory.store';
import {
  RawMaterialBatch,
  RawMaterialBatchStatus,
} from '../../../domain/model/raw-material-batch.entity';
import { MAX_STOCK } from '../../../domain/model/stock-limits';
import { todayInLima } from '../../../../shared/presentation/utils/local-date';
import { codeValidator } from '../../../../shared/presentation/validators/code.validator';
import {
  addYears,
  afterDateValidator,
  maxDateValidator,
  MIN_DATE,
  minDateValidator,
  noFutureDateValidator,
} from '../../../../shared/presentation/validators/date.validators';
import { notBlankValidator } from '../../../../shared/presentation/validators/not-blank.validator';
import { stockQuantityValidator } from '../../../../shared/presentation/validators/stock-quantity.validator';

import { InventorySummary } from '../../components/inventory-summary/inventory-summary';
import { RawMaterialBatchesTable } from '../../components/raw-material-batches-table/raw-material-batches-table';
import { RawMaterialForm } from '../../components/raw-material-form/raw-material-form';
import { ReceiveBatchForm } from '../../components/receive-batch-form/receive-batch-form';
import { BatchReviewForm } from '../../components/batch-review-form/batch-review-form';
import { ContainerAssignmentForm } from '../../components/container-assignment-form/container-assignment-form';
import { InventoryMovementsTable } from '../../components/inventory-movements-table/inventory-movements-table';
import { LegacyMaterialHistoryTable } from '../../components/legacy-material-history-table/legacy-material-history-table';

@Component({
  selector: 'app-inventory-detail',
  standalone: true,
  imports: [
    InventorySummary,
    RawMaterialBatchesTable,
    RawMaterialForm,
    ReceiveBatchForm,
    BatchReviewForm,
    ContainerAssignmentForm,
    InventoryMovementsTable,
    LegacyMaterialHistoryTable,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    TranslatePipe,
  ],
  templateUrl: './inventory-detail.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './inventory-detail.css',
})
export class InventoryDetail implements OnInit {
  readonly store = inject(InventoryStore);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  readonly receiving = signal(false);
  readonly editing = signal(false);
  readonly reviewing = signal<RawMaterialBatch | null>(null);
  readonly storing = signal<RawMaterialBatch | null>(null);
  readonly minDate = MIN_DATE;
  /** Latest expiration date: ten years ahead, a generous shelf life for a raw material. */
  get maxExpiryDate(): string {
    return addYears(todayInLima(), 10);
  }
  /** Latest reception date: today in Lima. */
  get maxReceiptDate(): string {
    return todayInLima();
  }
  readonly metadata = this.fb.nonNullable.group({
    code: ['', [Validators.required, notBlankValidator, codeValidator, Validators.maxLength(50)]],
    name: ['', [Validators.required, notBlankValidator, Validators.maxLength(150)]],
    minimumStock: [0, [Validators.required, Validators.min(0), Validators.max(MAX_STOCK)]],
  });
  /** Reception date control, kept apart because the expiration date is compared with it. */
  private readonly receivedOn = this.fb.nonNullable.control('', [
    Validators.required,
    minDateValidator(),
    noFutureDateValidator(),
  ]);
  readonly receiptForm = this.fb.nonNullable.group({
    supplier: ['', [Validators.required, notBlankValidator, Validators.maxLength(150)]],
    batchNumber: [
      '',
      [Validators.required, notBlankValidator, codeValidator, Validators.maxLength(50)],
    ],
    amount: [0, [Validators.required, Validators.min(0.001), Validators.max(MAX_STOCK)]],
    receivedOn: this.receivedOn,
    expiresOn: [
      '',
      [
        Validators.required,
        minDateValidator(),
        maxDateValidator(() => this.maxExpiryDate),
        afterDateValidator(() => this.receivedOn.value, true),
      ],
    ],
  });
  readonly reviewForm = this.fb.nonNullable.group({
    status: ['RELEASED' as RawMaterialBatchStatus, Validators.required],
    reason: ['', [Validators.required, notBlankValidator, Validators.maxLength(500)]],
  });
  constructor() {
    this.receivedOn.valueChanges
      .pipe(takeUntilDestroyed(this.destroy))
      .subscribe(() => this.receiptForm.controls.expiresOn.updateValueAndValidity());
  }
  readonly containerForm = this.fb.group({
    containerMonitorId: this.fb.control<number | null>(null, Validators.required),
  });
  ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroy)).subscribe((params) => {
      this.receiving.set(false);
      this.editing.set(false);
      this.reviewing.set(null);
      this.storing.set(null);
      void this.store.load(
        Number(params.get('environmentId')),
        Number(params.get('rawMaterialId')),
      );
    });
  }
  load() {
    return this.store.load(this.store.environmentId()!, this.store.selectedId());
  }
  edit() {
    const material = this.store.selected();
    if (!material) return;
    this.metadata.reset({
      code: material.code,
      name: material.name,
      minimumStock: material.minimumStock,
    });
    this.editing.set(true);
  }
  async save() {
    const material = this.store.selected();
    if (!material) return;
    this.metadata.controls.minimumStock.setValidators([
      Validators.required,
      Validators.min(0),
      Validators.max(MAX_STOCK),
      stockQuantityValidator(material.unit),
    ]);
    this.metadata.controls.minimumStock.updateValueAndValidity();
    this.metadata.markAllAsTouched();
    if (this.metadata.invalid) return;
    if (
      await this.store.saveMaterial(
        { ...this.metadata.getRawValue(), unit: material.unit },
        material.id,
      )
    )
      this.editing.set(false);
  }
  async receive() {
    const material = this.store.selected();
    if (!material) return;
    this.receiptForm.controls.amount.setValidators([
      Validators.required,
      Validators.min(0.001),
      Validators.max(MAX_STOCK),
      stockQuantityValidator(material.unit),
    ]);
    this.receiptForm.controls.amount.updateValueAndValidity();
    this.receiptForm.markAllAsTouched();
    if (this.receiptForm.invalid) return;
    if (
      await this.store.receive(material.id, {
        ...this.receiptForm.getRawValue(),
        unit: material.unit,
      })
    ) {
      this.receiving.set(false);
      this.receiptForm.reset();
    }
  }
  startReview(receipt: RawMaterialBatch) {
    this.storing.set(null);
    this.reviewing.set(receipt);
    this.reviewForm.reset({
      status:
        receipt.status === 'QUARANTINED' && receipt.availability !== 'EXPIRED'
          ? 'RELEASED'
          : 'REJECTED',
      reason: '',
    });
  }
  /** Opens the form to store the lot in a container monitor of the environment (US43). */
  startStoring(receipt: RawMaterialBatch) {
    this.reviewing.set(null);
    this.storing.set(receipt);
    const current = this.store
      .availableContainers()
      .some((container) => container.id === receipt.containerMonitorId);
    this.containerForm.reset({ containerMonitorId: current ? receipt.containerMonitorId : null });
  }
  async storeInContainer() {
    this.containerForm.markAllAsTouched();
    const receipt = this.storing();
    const containerMonitorId = this.containerForm.controls.containerMonitorId.value;
    if (this.containerForm.invalid || !receipt || containerMonitorId === null) return;
    if (await this.store.assignContainer(receipt, containerMonitorId)) this.storing.set(null);
  }
  async review() {
    this.reviewForm.markAllAsTouched();
    const receipt = this.reviewing();
    if (this.reviewForm.invalid || !receipt) return;
    const value = this.reviewForm.getRawValue();
    if (await this.store.review(receipt, value)) this.reviewing.set(null);
  }
}
