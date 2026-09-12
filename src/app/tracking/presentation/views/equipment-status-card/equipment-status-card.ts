import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { EquipmentStatus } from '../../../domain/model/equipment-status.entity';

/**
 * Presentational component for displaying the real-time operational status of equipment.
 *
 * @remarks
 * This component belongs to the presentation layer and acts as a pure UI component.
 * It receives equipment telemetry status data through inputs and renders the
 * information using Angular Material components. It does not fetch data, mutate
 * application state, or coordinate domain workflows.
 */
@Component({
  selector: 'app-equipment-status-card',
  standalone: true,
  imports: [CommonModule, TranslateModule, MatCardModule, MatIconModule],
  templateUrl: './equipment-status-card.html',
  styleUrl: './equipment-status-card.css',
})
export class EquipmentStatusCardComponent {
  /**
   * Current operational status record for the equipment.
   *
   * @remarks
   * This input is provided by a parent container component. It accepts `null`
   * so the card can handle asynchronous loading states without breaking the UI.
   */
  @Input({ required: true }) statusRecord!: EquipmentStatus | null;

  /**
   * Human-readable equipment name displayed in the card header.
   *
   * @remarks
   * This value is purely presentational and helps users identify which equipment
   * the telemetry status belongs to.
   */
  @Input() equipmentName: string = '';
}
