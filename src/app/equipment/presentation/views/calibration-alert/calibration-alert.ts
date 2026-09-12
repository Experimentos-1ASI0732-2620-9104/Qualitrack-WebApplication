import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { RouterModule } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MatTooltipModule } from '@angular/material/tooltip';

import { EquipmentStore } from '../../../application/equipment.store';

/**
 * Component responsible for displaying equipment calibration and maintenance alerts.
 *
 * @remarks
 * This standalone Angular component presents equipment that may require
 * calibration, maintenance, or technical attention.
 *
 * It consumes EquipmentStore to access computed selectors related to equipment
 * operational status, especially equipment returned by needsMaintenance.
 *
 * The component belongs to the equipment management feature and is intended to
 * warn users about equipment that should not be considered fully operational
 * until it is reviewed, calibrated, or maintained.
 *
 * Angular Material modules are used to display the alert content using cards,
 * lists, buttons, icons, and tooltips.
 *
 * @example
 * ```html
 * <app-calibration-alert></app-calibration-alert>
 * ```
 */
@Component({
  selector: 'app-calibration-alert',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatTooltipModule,
    RouterModule,
    TranslatePipe,
  ],
  templateUrl: './calibration-alert.html',
  styleUrl: './calibration-alert.css',
})
export class CalibrationAlert {
  /**
   * Store responsible for equipment-related state and operations.
   *
   * @remarks
   * The store provides access to equipment lists, computed selectors,
   * loading states, success messages, and error messages.
   *
   * In this component, it is mainly used to obtain equipment that requires
   * calibration or maintenance attention through the needsMaintenance selector.
   */
  protected readonly store = inject(EquipmentStore);
}
