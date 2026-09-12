import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { EquipmentStore } from '../../../application/equipment.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { CalibrationAlert } from '../calibration-alert/calibration-alert';

/**
 * Component responsible for displaying the equipment list.
 *
 * @remarks
 * This standalone Angular component shows the equipment registered for the
 * current laboratory or authenticated user context.
 *
 * It uses EquipmentStore to load and expose equipment data, IamStore to obtain
 * the current numeric user identifier used as the laboratory identifier, and
 * Angular Material components to render the information in a table with actions,
 * chips, tooltips, icons, and loading indicators.
 *
 * The component also includes CalibrationAlert to display equipment that may
 * require maintenance or calibration attention.
 *
 * @example
 * ```html
 * <app-equipment-list></app-equipment-list>
 * ```
 */
@Component({
  selector: 'app-equipment-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    CalibrationAlert,
    RouterModule,
    TranslatePipe,
  ],
  templateUrl: './equipment-list.html',
  styleUrl: './equipment-list.css',
})
export class EquipmentList implements OnInit {
  /**
   * Store responsible for equipment-related state and operations.
   *
   * @remarks
   * This store provides access to the equipment list, loading state, errors,
   * success messages, and computed selectors related to operational or
   * maintenance-required equipment.
   */
  protected readonly store = inject(EquipmentStore);

  /**
   * Store responsible for identity and access management state.
   *
   * @remarks
   * This store is used to obtain the current user identifier. In this component,
   * the current numeric user identifier is used as the laboratory identifier to
   * load the corresponding equipment records.
   */
  private readonly iamStore = inject(IamStore);

  /**
   * Columns displayed in the equipment table.
   *
   * @remarks
   * These values define the order and identifiers of the columns rendered
   * in the Angular Material table. Each column corresponds to equipment
   * information or available row actions.
   */
  protected readonly displayedColumns: string[] = [
    'name',
    'type',
    'model',
    'serialNumber',
    'status',
    'actions',
  ];

  /**
   * Gets the current laboratory identifier from the authenticated user context.
   *
   * @returns The current laboratory numeric identifier.
   *
   * @remarks
   * The application currently uses the authenticated user ID as the laboratory
   * context. If no user ID is available, it falls back to 1 to keep the view
   * usable during local development or seeded demo scenarios.
   */
  private get currentLabId(): number {
    return this.iamStore.requireLaboratoryId();
  }

  /**
   * Initializes the component and loads the equipment list.
   *
   * @remarks
   * During initialization, this method obtains the current numeric labId from
   * IamStore and requests the equipment list through EquipmentStore.
   */
  ngOnInit(): void {
    this.store.loadEquipment(this.currentLabId);
  }

  /**
   * Refreshes the equipment list.
   *
   * @remarks
   * This method reloads the equipment records associated with the current
   * numeric labId. It is commonly triggered from the UI when the user wants
   * to manually update the displayed equipment table.
   */
  protected onRefresh(): void {
    this.store.loadEquipment(this.currentLabId);
  }
}
