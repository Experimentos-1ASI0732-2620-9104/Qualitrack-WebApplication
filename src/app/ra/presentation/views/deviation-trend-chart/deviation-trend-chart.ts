import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

import { RaStore } from '../../../application/ra.store';
import { TrendDirection } from '../../../domain/model/deviation-trend.entity';
import { EquipmentStore } from '../../../../equipment/application/equipment.store';
import { IamStore } from '../../../../iam/application/iam.store';

/**
 * Component responsible for visualizing historical deviation trends for specific equipment.
 *
 * @remarks
 * In the presentation layer, this component subscribes to the reactive state managed
 * by {@link RaStore} to display tabular trend analysis for equipment process parameters.
 * It highlights measurements that breach their configured operational thresholds.
 *
 * When used directly as a routed view, it loads the laboratory equipment list and
 * allows the user to select the equipment to analyze.
 */
@Component({
  selector: 'app-deviation-trend-chart',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TranslateModule,
    MatCardModule,
    MatTableModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './deviation-trend-chart.html',
  styleUrl: './deviation-trend-chart.css',
})
export class DeviationTrendChartComponent implements OnInit {
  /**
   * The application store managing the state for the Reporting and Analysis bounded context.
   */
  protected readonly store = inject(RaStore);

  /**
   * Store used to load equipment available for the current laboratory.
   */
  protected readonly equipmentStore = inject(EquipmentStore);

  /**
   * Store used to retrieve the authenticated laboratory context.
   */
  private readonly iamStore = inject(IamStore);

  /**
   * Column identifiers displayed in the trend data table.
   */
  protected readonly displayedColumns = [
    'timestamp',
    'recordedValue',
    'lowerThreshold',
    'upperThreshold',
    'status',
  ];

  /**
   * The unique numeric identifier of the equipment to analyze.
   *
   * @remarks
   * This value may be provided by a parent component. If no input is provided,
   * the user can select an equipment from the local selector.
   */
  @Input() equipmentId: number = 0;

  /**
   * Reactive signal holding the currently selected equipment numeric identifier.
   */
  protected readonly selectedEquipmentId = signal<number>(0);

  /**
   * Retrieves the current laboratory ID from the authenticated IAM session.
   *
   * @returns The numeric laboratory identifier used to load equipment options.
   */
  private get currentLaboratoryId(): number {
    return this.iamStore.requireLaboratoryId();
  }

  /**
   * Lifecycle hook that initializes the component and loads selectable equipment.
   */
  ngOnInit(): void {
    this.equipmentStore.loadEquipment(this.currentLaboratoryId);

    this.selectedEquipmentId.set(Number(this.equipmentId) || 0);

    if (this.selectedEquipmentId()) {
      this.loadTrends();
    }
  }

  /**
   * Handles equipment selection from the view selector.
   *
   * @param equipmentId The selected equipment identifier
   */
  protected onEquipmentSelected(equipmentId: number): void {
    this.selectedEquipmentId.set(Number(equipmentId) || 0);
    this.loadTrends();
  }

  /**
   * Loads trend data for the currently selected equipment.
   *
   * @remarks
   * The method skips the request when no valid equipment ID is available.
   */
  protected loadTrends(): void {
    const equipmentId = this.selectedEquipmentId();
    if (!equipmentId) return;

    this.store.loadDeviationTrends(equipmentId);
  }

  /**
   * Resolves the Material icon name based on the detected trend direction.
   *
   * @param direction - The detected trend direction
   * @returns The corresponding Material Design icon identifier
   */
  protected getTrendIcon(direction: TrendDirection): string {
    switch (direction) {
      case 'INCREASING':
        return 'trending_up';
      case 'DECREASING':
        return 'trending_down';
      case 'STABLE':
      default:
        return 'trending_flat';
    }
  }

  /**
   * Evaluates whether a specific measurement falls outside its acceptable thresholds.
   *
   * @param value - The recorded measurement value
   * @param min - The lower acceptable threshold bound
   * @param max - The upper acceptable threshold bound
   * @returns `true` when the value is outside the accepted range; otherwise `false`
   */
  protected isDeviated(value: number, min: number, max: number): boolean {
    return value < min || value > max;
  }
}
