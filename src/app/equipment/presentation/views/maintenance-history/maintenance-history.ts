import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslatePipe } from '@ngx-translate/core';

import { EquipmentStore } from '../../../application/equipment.store';

/**
 * Component responsible for displaying the maintenance history of a specific equipment.
 *
 * @remarks
 * This standalone Angular component shows a table with the maintenance records
 * associated with an equipment. It obtains the equipment identifier from the
 * current route, loads the maintenance history through EquipmentStore, and
 * exposes the data to the template.
 *
 * The component belongs to the equipment management feature and communicates
 * with the application layer through EquipmentStore instead of calling the API
 * directly.
 *
 * Angular Material modules are used to display the maintenance history using
 * cards, tables, buttons, icons, and loading indicators.
 *
 * @example
 * ```html
 * <app-maintenance-history></app-maintenance-history>
 * ```
 */
@Component({
  selector: 'app-maintenance-history',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    RouterModule,
    TranslatePipe,
  ],
  templateUrl: './maintenance-history.html',
  styleUrl: './maintenance-history.css',
})
export class MaintenanceHistory implements OnInit {
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
   * The store provides access to maintenance history, selected equipment,
   * loading state, errors, success messages, and methods for loading
   * maintenance records.
   */
  protected readonly store = inject(EquipmentStore);

  /**
   * Signal that stores the current numeric equipment identifier.
   *
   * @remarks
   * The value is obtained from the route during component initialization.
   * It remains null if the route does not contain a valid equipment identifier.
   */
  protected readonly equipmentId = signal<number | null>(null);

  /**
   * Columns displayed in the maintenance history table.
   *
   * @remarks
   * These values define the order and identifiers of the columns rendered
   * in the Angular Material table.
   */
  protected readonly displayedColumns: string[] = ['date', 'type', 'technician', 'description'];

  /**
   * Initializes the component and loads the maintenance history.
   *
   * @remarks
   * During initialization, this method reads the equipment id from the route.
   * If the id exists, it stores it in the equipmentId signal and requests the
   * equipment plus its maintenance history from EquipmentStore.
   *
   * Loading the equipment by ID allows this view to work correctly even when
   * the user enters the route directly.
   */
  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');

    if (idParam) {
      const id = Number(idParam);

      this.equipmentId.set(id);
      this.store.loadEquipmentById(id);
      this.store.loadMaintenanceHistory(id);
    }
  }

  /**
   * Navigates back to the previous browser history entry.
   *
   * @remarks
   * This method is commonly triggered by a back button in the template.
   * It uses the browser history API to return to the previous view.
   */
  protected onBack(): void {
    window.history.back();
  }
}
