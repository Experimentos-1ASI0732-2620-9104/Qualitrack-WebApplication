import { Component, OnInit, effect, untracked, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { CaStore } from '../../../application/ca.store';
import { EquipmentStore } from '../../../../equipment/application/equipment.store';
import { IamStore } from '../../../../iam/application/iam.store';

@Component({
  selector: 'app-alert-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    TranslateModule,
    MatTableModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './alert-dashboard.html',
  styleUrl: './alert-dashboard.css',
})
export class AlertDashboard implements OnInit {
  protected readonly store = inject(CaStore);
  protected readonly equipmentStore = inject(EquipmentStore);
  protected readonly iamStore = inject(IamStore);

  private readonly router = inject(Router);

  protected readonly selectedEquipmentId = signal<number>(0);

  protected readonly displayedColumns: string[] = [
    'timestamp',
    'parameter',
    'severity',
    'status',
    'actions',
  ];

  constructor() {
    effect(() => {
      const first = this.equipmentStore.equipmentList()[0];
      if (this.equipmentStore.isLoading() || this.equipmentStore.error() || !first) return;
      untracked(() => {
        if (this.selectedEquipmentId()) return;
        this.selectedEquipmentId.set(first.id);
        this.loadData();
      });
    });
  }

  private get currentLaboratoryId(): number {
    return this.iamStore.requireLaboratoryId();
  }

  ngOnInit(): void {
    this.equipmentStore.loadEquipment(this.currentLaboratoryId);
  }


  protected onEquipmentChange(): void {
    this.loadData();
  }

  protected onRefresh(): void {
    this.loadData();
  }

  protected viewDetails(alertId: number): void {
    this.router.navigate(['/alerts/deviation-detail', alertId]).then();
  }


  private loadData(): void {
    const equipmentId = this.selectedEquipmentId();
    if (!equipmentId) return;

    this.store.loadAlerts({ equipmentId });
  }
}
