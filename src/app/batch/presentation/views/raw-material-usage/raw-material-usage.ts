import { Component, Input, OnInit, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BatchStore } from '../../../application/batch.store';
import { stockQuantityValidator } from '../../../../shared/presentation/stock-quantity-validator';

import { ReceiptConsumptionStore } from '../../../../inventory/application/receipt-consumption.store';

@Component({
  selector: 'app-raw-material-usage',
  standalone: true,
  providers: [ReceiptConsumptionStore],
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    TranslateModule,
    RouterLink,
  ],
  templateUrl: './raw-material-usage.html',
  styleUrl: './raw-material-usage.css',
})
export class RawMaterialUsageComponent implements OnInit {
  @Input() batchId!: number;
  protected readonly store = inject(BatchStore);
  protected readonly inventory = inject(ReceiptConsumptionStore);
  private readonly fb = inject(FormBuilder);
  protected readonly displayedColumns = ['material', 'quantity', 'date'];
  protected readonly usageForm = this.fb.group({
    rawMaterialId: [null as number | null, Validators.required],
    receiptId: [null as number | null, Validators.required],
    quantityUsed: [null as number | null, [Validators.required, Validators.min(0.001)]],
  });
  constructor() {
    this.usageForm.controls.rawMaterialId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((id) => {
        this.usageForm.controls.receiptId.reset();
        void this.inventory.selectMaterial(id);
      });
    this.usageForm.controls.receiptId.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((id) => this.inventory.receiptId.set(id));
    effect(() => {
      const receipt = this.inventory.selectedReceipt();
      this.usageForm.controls.quantityUsed.setValidators([
        Validators.required,
        Validators.min(0.001),
        Validators.max(receipt?.availableAmount ?? 0),
        stockQuantityValidator(receipt?.unit ?? ''),
      ]);
      this.usageForm.controls.quantityUsed.updateValueAndValidity({ emitEvent: false });
    });
  }
  ngOnInit() {
    void this.inventory.loadMaterials();
    if (this.batchId) this.store.loadBatchUsage(this.batchId);
  }
  protected async onAddMaterial() {
    this.usageForm.markAllAsTouched();
    if (this.usageForm.invalid || !this.batchId) return;
    if (
      await this.inventory.consume(this.batchId, Number(this.usageForm.controls.quantityUsed.value))
    ) {
      this.usageForm.reset();
      this.store.loadBatchUsage(this.batchId);
    }
  }
}
