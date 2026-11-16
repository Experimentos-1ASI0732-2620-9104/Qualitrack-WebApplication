import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { TranslatePipe } from '@ngx-translate/core';

import { RaStore } from '../../../application/ra.store';
import { lastDays } from '../../../domain/model/indicator-period';
import { DataPoint } from '../../../domain/model/deviation-trend.entity';
import { DeviationEvents } from '../../components/deviation-events/deviation-events';

type AlertFilter = 'all' | 'WARNING' | 'CRITICAL';

/**
 * Smart component representing the detail view for a specific deviation trend.
 *
 * @remarks
 * This page extracts the target equipment and parameter from the route,
 * retrieves the corresponding trend from the store, and allows the user
 * to filter the recorded events by date range and alert severity.
 */
@Component({
  selector: 'app-deviation-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    TranslatePipe,
    DeviationEvents,
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './deviation-detail-page.html',
  styleUrl: './deviation-detail-page.css',
})
export class DeviationDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  protected readonly store = inject(RaStore);

  /** The ID of the equipment being viewed. */
  protected readonly equipmentId = signal<number | null>(null);

  /** The parameter name (e.g., 'Temperature') being viewed. */
  protected readonly parameter = signal<string | null>(null);

  /** The environment of the equipment being viewed. */
  private readonly environmentId = signal<number | null>(null);

  /** Start date for filtering events. */
  protected readonly fromDate = signal<Date | null>(null);

  /** End date for filtering events. */
  protected readonly toDate = signal<Date | null>(null);

  /** Currently selected alert severity filter. */
  protected readonly alertFilter = signal<AlertFilter>('all');

  /**
   * Handles the selection of a date range from the calendar.
   * Normalizes the start time to 00:00:00 and the end time to 23:59:59.999
   * to ensure inclusive filtering for the entire selected days.
   *
   * @param range - The date range object emitted by the Material Datepicker.
   */
  protected onDateRangeChange(range: { start: Date | null, end: Date | null } | null) {
    if (range && range.start && range.end) {
      const start = new Date(range.start);
      const end = new Date(range.end);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      this.fromDate.set(start);
      this.toDate.set(end);
    } else {
      this.fromDate.set(null);
      this.toDate.set(null);
    }
  }

  /** Resolves a device ID to its human-readable label. */
  protected deviceLabel(id: number): string {
    return this.store.deviceName(id) ?? `#${id}`;
  }

  /**
   * Computes the active deviation trend based on the route parameters.
   * Matches by equipment ID and performs a case-insensitive comparison
   * on the parameter name.
   */
  protected readonly trend = computed(() => {
    const eq = this.equipmentId();
    const param = this.parameter();
    if (eq === null || param === null) return null;

    const trends = this.store.deviationTrends();
    const decodedParam = decodeURIComponent(param).toLowerCase();

    return (
      trends.find(
        (t) =>
          t.equipmentId === eq &&
          (t.parameterName === param ||
            t.parameterName?.toLowerCase() === decodedParam),
      ) ?? null
    );
  });

  /** The limits of the variable, from the profile of its device; null when it has none. */
  protected readonly thresholds = computed(() => {
    const trend = this.trend();
    return trend ? (this.store.profiles()[trend.equipmentId]?.threshold(trend.parameterName) ?? null) : null;
  });

  /**
   * Computes the list of events filtered by the selected date range and alert type.
   * Results are sorted chronologically, newest first.
   */
  protected readonly filteredPoints = computed(() => {
    const trend = this.trend();
    if (!trend) return [];

    const points: DataPoint[] = trend.dataPoints;
    const fromDate = this.fromDate();
    const toDate = this.toDate();
    const filter = this.alertFilter();

    let fromMs = null;
    if (fromDate) {
      const fromD = new Date(fromDate);
      fromD.setHours(0, 0, 0, 0);
      fromMs = fromD.getTime();
    }

    let toMs = null;
    if (toDate) {
      const toD = new Date(toDate);
      toD.setHours(23, 59, 59, 999);
      toMs = toD.getTime();
    }

    return points
      .filter((p) => p.state === 'WARNING' || p.state === 'CRITICAL')
      .filter((p) => (filter === 'all' ? true : p.state === filter))
      .filter((p) => {
        const ts = Date.parse(p.timestamp);
        if (fromMs !== null && ts < fromMs) return false;
        if (toMs !== null && ts > toMs) return false;
        return true;
      })
      .sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  });

  /**
   * Computes the total counts of events (total, warnings, criticals)
   * based on the full unfiltered trend data.
   */
  protected readonly counts = computed(() => {
    const devs = (this.trend()?.dataPoints ?? []).filter(
      (p) => p.state === 'WARNING' || p.state === 'CRITICAL',
    );
    return {
      total: devs.length,
      warning: devs.filter((p) => p.state === 'WARNING').length,
      critical: devs.filter((p) => p.state === 'CRITICAL').length,
    };
  });

  constructor() {
    // The limit each event crossed comes from the profile of the device.
    effect(() => {
      const equipmentId = this.equipmentId();
      const environmentId = this.environmentId();
      if (equipmentId !== null && environmentId !== null) this.store.loadProfile(equipmentId, environmentId);
    });
  }

  /**
   * Initializes the component by loading necessary data and resolving route parameters.
   *
   * @remarks
   * It also checks query parameters (`days` and `env`) to reload the trends
   * with the correct context if the user lands on this page via a direct link.
   */
  async ngOnInit() {
    this.store.loadDevices();

    await this.store.loadEnvironments();

    this.route.paramMap.subscribe((params) => {
      const eq = Number(params.get('equipmentId'));
      this.equipmentId.set(Number.isFinite(eq) ? eq : null);
      this.parameter.set(params.get('parameter'));

      this.route.queryParams.subscribe(query => {
        const days = query['days'] ? Number(query['days']) : 7;
        const envId = query['env'] ? Number(query['env']) : this.store.preferredEnvironmentId();
        this.environmentId.set(envId);

        if (envId !== null && !this.store.deviationTrends().length) {
          this.store.loadDeviationTrends(envId, lastDays(days));
        }
      });
    });
  }

  /** Resets all active filters to their default state. */
  protected clearFilters() {
    this.fromDate.set(null);
    this.toDate.set(null);
    this.alertFilter.set('all');
  }

  /** Navigates back to the previous view using the browser's history. */
  protected goBack() {
    this.location.back();
  }
}
