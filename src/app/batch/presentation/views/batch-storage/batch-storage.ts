import {
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BatchStore, batchError } from '../../../application/batch.store';
import { BatchPath } from '../../../domain/model/batch-path';
import { ProductionEquipment } from '../../../domain/model/production-equipment.entity';
import { ProductionEnvironment } from '../../../domain/model/production-environment.entity';
import { IamStore } from '../../../../iam/application/iam.store';
import { DateTimePipe } from '../../../../shared/presentation/pipes/date-time.pipe';
import { personLabel } from '../../batch-people';

/**
 * Operational container monitors of one product storage environment.
 *
 * @author Qualitrack
 */
interface StorageArea {
  /**
   * The product storage environment.
   */
  environment: ProductionEnvironment;

  /**
   * The operational container monitors located in the environment.
   */
  containers: ProductionEquipment[];
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
    DateTimePipe,
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    TranslatePipe,
  ],
  templateUrl: './batch-storage.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './batch-storage.css',
})
export class BatchStorage implements OnInit {
  /** Laboratory, environment and product of the batch. */
  readonly path = input.required<BatchPath>();
  /** Identifier of the batch. */
  readonly batchId = input.required<number>();
  protected readonly store = inject(BatchStore);
  protected readonly iam = inject(IamStore);
  private readonly translate = inject(TranslateService);

  /** Equipment and devices of the laboratory. */
  protected readonly equipment = signal<ProductionEquipment[]>([]);
  /** Translation key or server message of the failure to load the data; null when there is none. */
  protected readonly loadError = signal<string | null>(null);
  /** Identifier of the container monitor selected in the form; null while none is selected. */
  protected containerMonitorId: number | null = null;
  /** Container where the batch is stored now; null while it has none. */
  protected readonly container = computed(() => this.store.traceability()?.container ?? null);

  /** Product storage environments with their operational container monitors. */
  protected readonly storageAreas = computed<StorageArea[]>(() =>
    this.store
      .environments()
      .filter((environment) => environment.usage === 'PRODUCT_STORAGE')
      .map((environment) => ({
        environment,
        containers: this.equipment().filter(
          (item) =>
            item.isContainerMonitor && item.environmentId === environment.id && item.isOperational,
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
    try {
      await this.store.loadEnvironments();
      if (this.editable()) this.equipment.set(await this.store.loadProductionEquipment());
    } catch (error) {
      this.loadError.set(batchError(error));
    }
  }

  /**
   * Name of the person who stored the batch.
   *
   * @param userId - The user account
   * @returns The full name, "you" or the user id
   */
  protected person(userId: number | null): string {
    return personLabel(this.store, this.translate, userId);
  }

  /**
   * Name of the environment of the container, or its identifier while environments are loading.
   *
   * @param environmentId - The environment identifier.
   * @returns The code and name of the environment, or `#id` when it is not loaded yet.
   */
  protected environmentName(environmentId: number): string {
    const environment = this.store.environments().find((item) => item.id === environmentId);
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
