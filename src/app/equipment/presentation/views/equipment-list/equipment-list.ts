import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe } from '@ngx-translate/core';

import { EquipmentStore } from '../../../application/equipment.store';
import { Equipment } from '../../../domain/model/equipment.entity';
import { ATTENTION_STATUSES } from '../../../domain/model/equipment-status';
import { EnvironmentStore } from '../../../../laboratory/application/environment.store';

/** Which equipment the list shows: everything, process equipment or IoT devices. */
type EquipmentFilter = 'all' | 'equipment' | 'devices';

/**
 * Equipment and IoT devices of the laboratory with their location and status (US46).
 *
 * @remarks
 * Equipment in maintenance or out of service is counted in the summary and can be filtered,
 * like low stock materials in the inventory.
 */
@Component({
  selector: 'app-equipment-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatButtonToggleModule,
    MatCheckboxModule,
    MatIconModule,
    MatInputModule,
    TranslatePipe,
  ],
  templateUrl: './equipment-list.html',
  styleUrls: ['../../../../shared/presentation/styles/operations-page.css', './equipment-list.css'],
})
export class EquipmentList implements OnInit {
  protected readonly store = inject(EquipmentStore);

  private readonly environments = inject(EnvironmentStore);

  protected readonly filter = signal<EquipmentFilter>('all');

  protected readonly search = signal('');

  protected readonly attentionOnly = signal(false);

  protected readonly visibleEquipment = computed(() => {
    const byType = this.filter() === 'equipment' ? this.store.processEquipment()
      : this.filter() === 'devices' ? this.store.iotDevices() : this.store.equipmentList();
    const text = this.search().trim().toLowerCase();
    return byType
      .filter((equipment) => !this.attentionOnly() || this.needsAttention(equipment))
      .filter((equipment) => !text || [equipment.name, equipment.model, equipment.serialNumber, equipment.sensorExternalId ?? '']
        .some((value) => value.toLowerCase().includes(text)));
  });

  ngOnInit(): void {
    this.store.loadEquipment();
    void this.environments.loadEnvironments();
  }

  protected reload(): void {
    this.store.loadEquipment();
  }

  protected needsAttention(equipment: Equipment): boolean {
    return ATTENTION_STATUSES.includes(equipment.status);
  }

  /** Name of the environment where the equipment is located, if it is known. */
  protected environmentName(equipment: Equipment): string | null {
    if (equipment.environmentId === null) return null;
    const environment = this.environments.environments().find((item) => item.id === equipment.environmentId);
    return environment ? `${environment.code} · ${environment.name}` : `#${equipment.environmentId}`;
  }
}
