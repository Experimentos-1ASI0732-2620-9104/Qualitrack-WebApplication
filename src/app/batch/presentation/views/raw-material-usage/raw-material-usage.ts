import { Component, Input, OnInit, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BatchStore } from '../../../application/batch.store';
import { LaboratoryStore } from '../../../../laboratory/application/laboratory.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { stockQuantityValidator } from '../../../../laboratory/presentation/stock-quantity-validator';

@Component({
  selector: 'app-raw-material-usage', standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, ReactiveFormsModule, TranslateModule, RouterLink],
  templateUrl: './raw-material-usage.html', styleUrl: './raw-material-usage.css',
})
export class RawMaterialUsageComponent implements OnInit {
  @Input() batchId!: number;
  protected readonly store = inject(BatchStore);
  protected readonly labStore = inject(LaboratoryStore);
  private readonly iamStore = inject(IamStore);
  private readonly fb = inject(FormBuilder);
  private readonly materialId = signal<number | null>(null);
  protected readonly selectedMaterial = computed(() =>
    this.labStore.rawMaterials().find(material => material.id === this.materialId()) ?? null);
  protected readonly displayedColumns = ['material', 'quantity', 'date'];
  protected readonly usageForm = this.fb.group({
    rawMaterialId: [null as number | null, Validators.required],
    quantityUsed: [null as number | null, [Validators.required, Validators.min(0.001)]],
  });

  constructor() {
    this.usageForm.controls.rawMaterialId.valueChanges.pipe(takeUntilDestroyed())
      .subscribe(id => this.materialId.set(id));
    effect(() => {
      const material = this.selectedMaterial();
      const quantity = this.usageForm.controls.quantityUsed;
      quantity.setValidators([Validators.required, Validators.min(0.001),
        Validators.max(material?.quantityInStock ?? 0), stockQuantityValidator(material?.unit ?? '')]);
      quantity.updateValueAndValidity({ emitEvent: false });
    });
  }

  ngOnInit(): void {
    this.store.clearMessages();
    this.labStore.loadRawMaterials(this.iamStore.requireLaboratoryId());
    if (this.batchId) this.store.loadBatchUsage(this.batchId);
  }

  protected async onAddMaterial(): Promise<void> {
    this.usageForm.markAllAsTouched();
    const material = this.selectedMaterial();
    if (this.usageForm.invalid || !material || !this.batchId || this.store.isLinking()) return;
    const saved = await this.store.linkMaterial(this.batchId, {
      rawMaterialId: material.id,
      quantityUsed: Number(this.usageForm.controls.quantityUsed.value),
      unit: material.unit,
    });
    this.labStore.loadRawMaterials(this.iamStore.requireLaboratoryId());
    if (saved) this.usageForm.reset();
  }
}
