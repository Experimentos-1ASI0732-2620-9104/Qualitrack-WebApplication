import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { TranslateModule } from '@ngx-translate/core';
import { InventoryStore } from '../../../application/inventory.store';
import {
  RawMaterialBatch,
  RawMaterialBatchStatus,
} from '../../../domain/model/raw-material-batch.entity';
import { stockQuantityValidator } from '../../../../shared/presentation/stock-quantity-validator';

@Component({
  selector: 'app-inventory-detail',
  standalone: true,
  providers: [InventoryStore],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    TranslateModule,
  ],
  templateUrl: './inventory-detail.html',
  styleUrl: '../inventory.css',
})
export class InventoryDetail implements OnInit {
  readonly store = inject(InventoryStore);
  private readonly route = inject(ActivatedRoute);
  private readonly destroy = inject(DestroyRef);
  private readonly fb = inject(FormBuilder);
  readonly receiving = signal(false);
  readonly editing = signal(false);
  readonly reviewing = signal<RawMaterialBatch | null>(null);
  readonly affectedBatches = computed(() => [
    ...new Set(
      this.store
        .movements()
        .filter((movement) => movement.type === 'CONSUMPTION' && movement.productBatchId !== null)
        .filter((movement) =>
          this.store
            .receipts()
            .some(
              (receipt) =>
                receipt.id === movement.receiptId &&
                ['OBSERVED', 'REJECTED'].includes(receipt.status),
            ),
        )
        .map((movement) => movement.productBatchId!),
    ),
  ]);
  readonly metadata = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.maxLength(150)]],
    minimumStock: [0, [Validators.required, Validators.min(0)]],
  });
  readonly receiptForm = this.fb.nonNullable.group({
    supplier: ['', [Validators.required, Validators.maxLength(150)]],
    batchNumber: ['', [Validators.required, Validators.maxLength(50)]],
    amount: [0, [Validators.required, Validators.min(0.001)]],
    receivedOn: ['', Validators.required],
    expiresOn: ['', Validators.required],
  });
  readonly reviewForm = this.fb.nonNullable.group({
    status: ['RELEASED' as RawMaterialBatchStatus, Validators.required],
    reason: ['', [Validators.required, Validators.maxLength(500)]],
  });
  ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroy)).subscribe((params) => {
      this.receiving.set(false);
      this.editing.set(false);
      this.reviewing.set(null);
      void this.load(Number(params.get('id')));
    });
  }
  load(id = this.store.selectedId()!) {
    return this.store.load(id);
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
    this.reviewing.set(receipt);
    this.reviewForm.reset({
      status:
        receipt.status === 'QUARANTINED' && receipt.availability !== 'EXPIRED'
          ? 'RELEASED'
          : 'REJECTED',
      reason: '',
    });
  }
  async review() {
    this.reviewForm.markAllAsTouched();
    const receipt = this.reviewing();
    if (this.reviewForm.invalid || !receipt) return;
    const value = this.reviewForm.getRawValue();
    if (await this.store.review(receipt.id, value)) this.reviewing.set(null);
  }
}
