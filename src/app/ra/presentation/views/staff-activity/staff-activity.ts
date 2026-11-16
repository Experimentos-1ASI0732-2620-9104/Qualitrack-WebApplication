import { Component, DestroyRef, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RaStore } from '../../../application/ra.store';
import { DateTimePipe } from '../../../../shared/presentation/pipes/date-time.pipe';
import { TablePaginator, paginate } from '../../../../shared/presentation/components/table-paginator/table-paginator';

/**
 * Records whose type has a translated name; any other type is shown as the platform sends it.
 */
const KNOWN_ENTITIES = new Set([
  'BATCH',
  'BPM_PARAMETER_CONFIG',
  'DEVIATION_ALERT',
  'ENVIRONMENT',
  'EQUIPMENT',
  'EQUIPMENT_TELEMETRY_STATUS',
  'ENVIRONMENTAL_PROFILE',
  'LABORATORY',
  'MAINTENANCE_RECORD',
  'NOTIFICATION_PREFERENCE',
  'PHARMACEUTICAL_PRODUCT',
  'RAW_MATERIAL',
  'RAW_MATERIAL_BATCH',
  'RAW_MATERIAL_USAGE',
  'STAFF_MEMBER',
  'TELEMETRY_ANOMALY',
  'TELEMETRY_HISTORY_POINT',
  'TELEMETRY_MEASUREMENT',
]);

/**
 * Actions with a translated name; any other action is shown as the platform sends it.
 */
const KNOWN_ACTIONS = new Set([
  'CREATE',
  'UPDATE',
  'DELETE',
  'RELEASE',
  'REJECT',
  'APPROVE',
  'REGISTER',
  'REMOVE',
  'EXPORT',
  'GENERATE',
]);


/** Audit activity of a staff member, filtered by record type, for quality managers and auditors. */
@Component({
  selector: 'app-staff-activity',
  standalone: true,
  imports: [TablePaginator, DateTimePipe, RouterLink, TranslatePipe, MatIconModule, MatFormFieldModule, MatSelectModule, MatProgressSpinnerModule],
  templateUrl: './staff-activity.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './staff-activity.css',
})
export class StaffActivity {
  /** Page of the table shown; ten rows unless the person chooses more. */
  protected readonly activityPage = paginate(() => this.visibleActivity());

  protected readonly store = inject(RaStore);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly staffId = signal<number | null>(null);
  protected readonly entityFilter = signal('ALL');
  protected readonly entityTypes = computed(() => [...new Set(this.store.staffActivity().map((entry) => entry.entityType))].sort());
  protected readonly visibleActivity = computed(() => this.entityFilter() === 'ALL'
    ? this.store.staffActivity()
    : this.store.staffActivity().filter((entry) => entry.entityType === this.entityFilter()));
  protected readonly lastActivity = computed(() => this.store.staffActivity()[0]?.timestamp ?? null);

  constructor() {
    this.destroyRef.onDestroy(() => this.store.clearStaffActivity());
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = Number(params.get('staffId'));
      this.staffId.set(Number.isSafeInteger(id) && id > 0 ? id : null);
      this.entityFilter.set('ALL');
      this.store.loadStaffActivity(id);
    });
  }

  /**
   * Returns the translation key of a record type.
   *
   * @param entityType - Record type sent by the platform
   * @returns Translation key, or `null` when the type has no translated name
   */
  protected entityKey(entityType: string): string | null {
    return KNOWN_ENTITIES.has(entityType)
      ? `staff.activity.entities.${entityType.toLowerCase()}`
      : null;
  }

  /**
   * Returns the translation key of an action.
   *
   * @param action - Action sent by the platform
   * @returns Translation key, or `null` when the action has no translated name
   */
  protected actionKey(action: string): string | null {
    return KNOWN_ACTIONS.has(action) ? `staff.activity.actions.${action.toLowerCase()}` : null;
  }

}
