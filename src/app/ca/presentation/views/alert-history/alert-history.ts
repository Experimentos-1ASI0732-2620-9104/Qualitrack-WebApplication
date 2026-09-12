import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';

import { CaStore } from '../../../application/ca.store';
import { AlertSeverity, AlertStatus } from '../../../domain/model/deviation-alert.entity';

@Component({
  selector: 'app-alert-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    TranslateModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
  ],
  templateUrl: './alert-history.html',
  styleUrl: './alert-history.css',
})
export class AlertHistory implements OnInit {
  protected readonly store = inject(CaStore);

  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  protected filterForm!: FormGroup;

  protected readonly displayedColumns: string[] = [
    'timestamp',
    'equipmentId',
    'parameter',
    'severity',
    'status',
    'actions',
  ];

  constructor() {
    this.initFilterForm();
  }

  ngOnInit(): void {
    this.store.clearError();
  }

  protected applyFilters(): void {
    const rawFilters = this.filterForm.value;

    const cleanFilters: {
      equipmentId?: number;
      batchId?: number;
      status?: AlertStatus;
      severity?: AlertSeverity;
    } = {};

    if (rawFilters.equipmentId) {
      cleanFilters.equipmentId = Number(rawFilters.equipmentId);
    }

    if (rawFilters.batchId) {
      cleanFilters.batchId = Number(rawFilters.batchId);
    }

    if (!cleanFilters.equipmentId && !cleanFilters.batchId) {
      this.store.clearAlerts();
      this.store.setError('Enter an equipment ID or batch ID to search alerts.');
      return;
    }

    if (rawFilters.status) {
      cleanFilters.status = rawFilters.status as AlertStatus;
    }

    if (rawFilters.severity) {
      cleanFilters.severity = rawFilters.severity as AlertSeverity;
    }

    this.store.loadAlerts(cleanFilters);
  }

  protected clearFilters(): void {
    this.filterForm.reset({
      status: '',
      severity: '',
      equipmentId: '',
      batchId: '',
    });

    this.store.clearError();
    this.store.clearAlerts();
  }

  protected viewDetails(alertId: number): void {
    this.router.navigate(['/alerts/deviation-detail', alertId]).then();
  }

  private initFilterForm(): void {
    this.filterForm = this.fb.group({
      status: [''],
      severity: [''],
      equipmentId: [''],
      batchId: [''],
    });
  }
}
