import {
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { BatchStore, batchError } from '../../../application/batch.store';
import { BatchPath } from '../../../infrastructure/batch-api-endpoint';
import { EquipmentApi } from '../../../../equipment/infrastructure/equipment-api';
import { Equipment } from '../../../../equipment/domain/model/equipment.entity';
import { EnvironmentStore } from '../../../../laboratory/application/environment.store';
import { Environment } from '../../../../laboratory/domain/model/environment.entity';
import { IamStore } from '../../../../iam/application/iam.store';

/**
 * Operational container monitors of one product storage environment.
 *
 * @author Qualitrack
 */
interface StorageArea {
  /**
   * The product storage environment.
   */
  environment: Environment;

  /**
   * The operational container monitors located in the environment.
   */
  containers: Equipment[];
}

/**
 * Monitored container where a product batch is stored.
 *
 * @remarks
 * Batches are stored in an operational container monitor of a product storage environment of the laboratory;
 * the backend rejects containers of other environments and monitors in maintenance or out of service.
 * The view shows the current container with a link to its conditions and, for users who operate, a form to
 * store or move the batch.
 *
 * @author Qualitrack
 */
@Component({
  selector: 'app-batch-storage',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    TranslateModule,
  ],
  templateUrl: './batch-storage.html',
  styleUrl: '../../../../shared/presentation/styles/operations-page.css',
})
export class BatchStorage implements OnInit {
  /** Laboratory, environment and product of the batch. */
  readonly path = input.required<BatchPath>();
  /** Identifier of the batch. */
  readonly batchId = input.required<number>();
  protected readonly store = inject(BatchStore);
  private readonly equipmentApi = inject(EquipmentApi);
  private readonly environments = inject(EnvironmentStore);
  protected readonly iam = inject(IamStore);

  /** Equipment and devices of the laboratory. */
  protected readonly equipment = signal<Equipment[]>([]);
  /** Translation key or server message of the failure to load the data; null when there is none. */
  protected readonly loadError = signal<string | null>(null);
  /** Identifier of the container monitor selected in the form; null while none is selected. */
  protected containerMonitorId: number | null = null;
  /** Container where the batch is stored now; null while it has none. */
  protected readonly container = computed(() => this.store.traceability()?.container ?? null);

  /** Product storage environments with their operational container monitors. */
  protected readonly storageAreas = computed<StorageArea[]>(() =>
    this.environments
      .environments()
      .filter((environment) => environment.usage === 'PRODUCT_STORAGE')
      .map((environment) => ({
        environment,
        containers: this.equipment().filter(
          (item) =>
            item.deviceType === 'CONTAINER_MONITOR' &&
            item.environmentId === environment.id &&
            item.status === 'OPERATIONAL',
        ),
      })),
  );

  /** Whether at least one operational container is available to store the batch. */
  protected readonly hasContainers = computed(() =>
    this.storageAreas().some((area) => area.containers.length > 0),
  );

  /** Users who register operations store batches; auditors only consult them. */
  protected readonly editable = this.iam.canOperate;

  /**
   * Lifecycle hook that loads the environments and, for users who operate, the equipment of the laboratory.
   */
  async ngOnInit(): Promise<void> {
    const laboratoryId = this.iam.requireLaboratoryId();
    try {
      if (!this.environments.loaded()) await this.environments.loadEnvironments();
      if (this.editable())
        this.equipment.set(await firstValueFrom(this.equipmentApi.getEquipment(laboratoryId)));
    } catch (error) {
      this.loadError.set(batchError(error));
    }
  }

  /**
   * Name of the environment of the container, or its identifier while environments are loading.
   *
   * @param environmentId - The environment identifier.
   * @returns The code and name of the environment, or `#id` when it is not loaded yet.
   */
  protected environmentName(environmentId: number): string {
    const environment = this.environments.environments().find((item) => item.id === environmentId);
    return environment ? `${environment.code} · ${environment.name}` : `#${environmentId}`;
  }

  /**
   * Stores the batch in the selected container and clears the selection on success.
   */
  protected async storeBatch(): Promise<void> {
    if (this.containerMonitorId === null) return;
    if (await this.store.assignContainer(this.path(), this.batchId(), this.containerMonitorId))
      this.containerMonitorId = null;
  }
}
