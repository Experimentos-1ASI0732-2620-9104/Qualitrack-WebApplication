import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslatePipe } from '@ngx-translate/core';

import { EquipmentStore } from '../../../application/equipment.store';

/**
 * Component responsible for displaying detailed information about a specific equipment.
 *
 * @remarks
 * This standalone Angular component shows the detail view of an equipment item.
 * It obtains the equipment identifier from the route, loads the equipment by ID,
 * loads the related BPM configuration, and retrieves the maintenance history
 * associated with that equipment.
 *
 * The component interacts with the EquipmentStore to access equipment state,
 * BPM parameter configurations, maintenance records, loading state, and other
 * related data. It does not communicate directly with the API.
 *
 * Angular Material modules are used to organize the detail view with tabs,
 * cards, buttons, icons, dividers, and progress indicators.
 *
 * @example
 * ```html
 * <app-equipment-detail></app-equipment-detail>
 * ```
 */
@Component({
  selector: 'app-equipment-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressBarModule,
    RouterModule,
    TranslatePipe,
  ],
  templateUrl: './equipment-detail.html',
  styleUrl: './equipment-detail.css',
})
export class EquipmentDetail implements OnInit {
  /**
   * ActivatedRoute instance used to access route parameters.
   *
   * @remarks
   * This component uses the current route to obtain the equipment identifier
   * from the URL parameter named id.
   */
  private readonly route = inject(ActivatedRoute);

  /**
   * Store responsible for equipment-related state and operations.
   *
   * @remarks
   * The store provides access to the equipment list, selected equipment,
   * BPM configurations, maintenance history, loading state, error messages,
   * and success messages.
   */
  protected readonly store = inject(EquipmentStore);

  /**
   * Signal that stores the current numeric equipment identifier.
   *
   * @remarks
   * The value is initialized from the route parameter during component startup.
   * It remains null if the route does not contain a valid equipment identifier.
   */
  protected readonly equipmentId = signal<number | null>(null);

  /**
   * Initializes the component and loads related equipment information.
   *
   * @remarks
   * During initialization, this method reads the equipment id from the route.
   * If the id exists, it stores the value in the equipmentId signal and then
   * loads the equipment by ID, BPM configuration, and maintenance history.
   *
   * Loading the equipment by ID allows the detail view to work even when the
   * user enters the route directly without previously loading the equipment list.
   */
  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      const id = Number(idParam);

      this.equipmentId.set(id);
      this.store.loadEquipmentById(id);
      this.store.loadBpmConfig(id);
      this.store.loadMaintenanceHistory(id);
    }
  }

  /**
   * Gets the equipment entity currently associated with this detail view.
   *
   * @returns The selected equipment if available, otherwise the matching item
   * from the equipment list.
   *
   * @remarks
   * This getter first checks the selected equipment loaded by ID. If no selected
   * equipment is available, it falls back to searching the equipment list.
   */
  protected get currentEquipment() {
    return (
      this.store.selectedEquipment() ??
      this.store.equipmentList().find((equipment) => equipment.id === this.equipmentId())
    );
  }
}
