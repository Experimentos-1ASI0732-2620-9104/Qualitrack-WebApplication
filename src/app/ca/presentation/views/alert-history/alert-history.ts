import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { ActivatedRoute, Params, Router, RouterLink, RouterOutlet } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { ActionBanner } from '../../../../shared/presentation/components/action-banner/action-banner';
import { EmptyState } from '../../../../shared/presentation/components/empty-state/empty-state';
import { EnvironmentSelector } from '../../../../shared/presentation/components/environment-selector/environment-selector';
import { ErrorBanner } from '../../../../shared/presentation/components/error-banner/error-banner';
import { FilterChip } from '../../../../shared/presentation/components/filter-chip/filter-chip';
import { CaStore } from '../../../application/ca.store';
import {
  AlertHistoryFilter,
  AlertHistoryPeriod,
  DEFAULT_ALERT_HISTORY_FILTER,
  filterAlertHistory,
  periodRangeOf,
} from '../../../domain/model/alert-history-filter';
import { countAlertsByWeek } from '../../../domain/model/alert-history-weeks';
import { compareAlertsByNewest } from '../../../domain/model/alert-priority';
import {
  AlertOrigin,
  AlertSeverity,
  AlertStatus,
  DeviationAlert,
} from '../../../domain/model/deviation-alert.entity';
import { ALERT_SEVERITY_CHIPS, ALERT_STATUS_CHIPS } from '../../alert-chips';
import {
  ALERT_HISTORY_ORIGINS,
  ALERT_HISTORY_PERIODS,
  ALERT_HISTORY_SEVERITIES,
  ALERT_HISTORY_STATUSES,
  filterFromQuery,
  queryFromFilter,
  reportQueryOf,
} from '../../alert-history-query';
import { alertVariableName } from '../../alert-variable';
import { AlertHistoryCards } from '../../components/alert-history-cards/alert-history-cards';
import { AlertTable } from '../../components/alert-table/alert-table';
import { AlertWeekChart } from '../../components/alert-week-chart/alert-week-chart';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { ListToolbar } from '../../../../shared/presentation/components/list-toolbar/list-toolbar';
import { alertTabs } from '../../alert-tabs';
import { SetupNotice } from '../../../../shared/presentation/components/setup-notice/setup-notice';
import { IamStore } from '../../../../iam/application/iam.store';

/** Icon of each origin in its chip. */
const ORIGIN_ICONS: Readonly<Record<AlertOrigin, string>> = {
  ENVIRONMENT: 'sensors',
  CONTAINER: 'inventory_2',
};

/**
 * Every alert of one environment or of the whole laboratory, including the resolved ones, to answer audit questions
 * such as how many critical alerts there were in September and who resolved them (TS74).
 *
 * @remarks
 * The alerts are read once and filtered in the browser, so every chip can tell how many alerts it leaves. The
 * environment, the filter and the page live in the address: the detail of an alert opens in a panel over the table,
 * and going back, reloading or sharing the page keeps what the person chose.
 */
@Component({
  selector: 'app-alert-history',
  standalone: true,
  imports: [
    SetupNotice,
    RouterLink,
    RouterOutlet,
    TranslatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    ActionBanner,
    AlertHistoryCards,
    AlertTable,
    AlertWeekChart,
    PageHeader,
    ListToolbar,
    EmptyState,
    EnvironmentSelector,
    ErrorBanner,
    FilterChip,
  ],
  templateUrl: './alert-history.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './alert-history.css',
})
export class AlertHistory implements OnInit {
  /** Store that holds the alerts of the history. */
  protected readonly store = inject(CaStore);
  protected readonly iam = inject(IamStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);

  private readonly queryParams = toSignal(this.route.queryParamMap);

  protected readonly periods = ALERT_HISTORY_PERIODS;
  protected readonly severities = ALERT_HISTORY_SEVERITIES;
  protected readonly statuses = ALERT_HISTORY_STATUSES;
  protected readonly origins = ALERT_HISTORY_ORIGINS;
  protected readonly severityChips = ALERT_SEVERITY_CHIPS;
  protected readonly statusChips = ALERT_STATUS_CHIPS;
  protected readonly originIcons = ORIGIN_ICONS;

  /** Whether the detail of an alert is open over the table; it shows its own messages then. */
  protected readonly detailOpen = signal(false);

  /** Moment the periods count back from; it moves forward every time the alerts are read. */
  protected readonly now = signal(new Date());

  /** Environment chosen, or null for every environment; an unknown one in the address counts as none. */
  protected readonly environmentId = computed(() => {
    const environmentId = Number(this.queryParams()?.get('environmentId'));
    return this.store.environments().some((environment) => environment.id === environmentId)
      ? environmentId
      : null;
  });

  /** Operations of the module, keeping the environment chosen. */
  protected readonly tabs = computed(() => alertTabs(this.environmentId()));

  /** What the history reads: the environment chosen or, without one, every environment that exists. */
  private readonly scope = computed(() => {
    const environmentId = this.environmentId();
    return environmentId === null
      ? `all:${this.store
        .environments()
        .map((environment) => environment.id)
        .join()}`
      : `one:${environmentId}`;
  });

  /** What the person chose in the chips and the search box. */
  protected readonly filter = computed(() =>
    this.queryParams() ? filterFromQuery(this.queryParams()!) : DEFAULT_ALERT_HISTORY_FILTER,
  );

  /** Whether a chip or the search narrows the table, which the exported report does not follow. */
  protected readonly narrowsTable = computed(() => {
    const filter = this.filter();
    return (
      filter.severities.length + filter.statuses.length + filter.origins.length > 0 ||
      filter.search.trim() !== ''
    );
  });

  /** Whether anything other than the default period narrows the list. */
  protected readonly isFiltered = computed(
    () => this.filter().period !== DEFAULT_ALERT_HISTORY_FILTER.period || this.narrowsTable(),
  );

  /** How many chips of severity, status and origin are pressed, which the button of the other filters shows. */
  protected readonly chipFilterCount = computed(() => {
    const filter = this.filter();
    return filter.severities.length + filter.statuses.length + filter.origins.length;
  });

  /** How many filters narrow the history, which the folded row of filters tells. */
  protected readonly activeFilterCount = computed(
    () =>
      this.chipFilterCount() +
      (this.filter().period !== DEFAULT_ALERT_HISTORY_FILTER.period ? 1 : 0) +
      (this.filter().search.trim() ? 1 : 0),
  );

  /** Alerts that pass the filter, the latest first. */
  protected readonly shownAlerts = computed(() =>
    this.filtered(this.filter()).sort(compareAlertsByNewest),
  );

  /** Address of the report generator with the period and the environment of the history. */
  protected readonly reportQuery = computed(() =>
    reportQueryOf(this.filter(), this.environmentId(), this.now()),
  );

  /** Alerts of each week of the period, by severity, for the weekly chart. */
  protected readonly weeks = computed(() => {
    const range = periodRangeOf(this.filter(), this.now());
    return countAlertsByWeek(this.shownAlerts(), range.since, range.until);
  });

  /** Codes of the environments that could not be read, for the warning that says so. */
  protected readonly unavailableEnvironments = computed(() => {
    const unavailableIds = this.store.unavailableEnvironmentIds();
    return this.store
      .environments()
      .filter((environment) => unavailableIds.includes(environment.id))
      .map((environment) => environment.code)
      .join(', ');
  });
  constructor() {
    effect(() => {
      this.scope();
      if (this.store.environmentsLoaded()) untracked(() => this.load());
    });
  }

  /**
   * Clears what a previous view left and loads the devices, the people and the environments.
   *
   * @remarks
   * The environments are read every time, because one can be created while the application is open. The alerts follow
   * the environment chosen as soon as the environments are known.
   */
  async ngOnInit(): Promise<void> {
    this.store.clearError();
    this.store.clearAlerts();
    this.store.loadDevices();
    this.store.loadPeople();
    await this.store.loadEnvironments();
  }

  /** Reads the alerts again, or the environments if they could not be read. */
  protected load(): void {
    if (!this.store.environmentsLoaded()) {
      void this.store.loadEnvironments();
      return;
    }
    this.now.set(new Date());
    this.store.loadAlertHistory(this.environmentId());
  }

  /**
   * Narrows the history to an environment and remembers it as the one the person prefers.
   *
   * @param environmentId - The environment chosen
   */
  protected chooseEnvironment(environmentId: number): void {
    this.store.rememberEnvironment(environmentId);
    this.navigate({ environmentId, page: null });
  }

  /** Goes back to every environment. */
  protected chooseAllEnvironments(): void {
    this.navigate({ environmentId: null, page: null });
  }

  /**
   * Shows the alerts of a period.
   *
   * @param period - Days back, or `null` for the person's own dates
   */
  protected choosePeriod(period: AlertHistoryPeriod): void {
    this.changeFilter({ period });
  }

  /**
   * Sets a day of the custom period.
   *
   * @param limit - Which day changes
   * @param day - The day, as `YYYY-MM-DD`, or an empty text to remove it
   *
   * @remarks
   * The browser reports a date with every digit of its year, and those are not steps to go back through.
   */
  protected chooseDay(limit: 'from' | 'to', day: string): void {
    this.changeFilter({ [limit]: day || null }, true);
  }

  protected toggleSeverity(severity: AlertSeverity): void {
    this.changeFilter({ severities: toggled(this.filter().severities, severity) });
  }

  protected toggleStatus(status: AlertStatus): void {
    this.changeFilter({ statuses: toggled(this.filter().statuses, status) });
  }

  protected toggleOrigin(origin: AlertOrigin): void {
    this.changeFilter({ origins: toggled(this.filter().origins, origin) });
  }

  /**
   * Looks for a text in the device, the variable, the environment and the resolution notes.
   *
   * @param search - What the person wrote
   */
  protected search(search: string): void {
    this.changeFilter({ search }, true);
  }

  /** Goes back to the filter the history opens with, keeping the environment. */
  protected clearFilters(): void {
    this.changeFilter(DEFAULT_ALERT_HISTORY_FILTER);
  }

  /**
   * How many alerts a chip would leave if it were the only one pressed in its group.
   *
   * @param changes - The group of the chip, with only that chip pressed
   * @returns How many alerts would pass the filter
   */
  protected countWith(changes: Partial<AlertHistoryFilter>): number {
    return this.filtered({ ...this.filter(), ...changes }).length;
  }

  /**
   * Alerts that pass a filter.
   *
   * @param filter - The filter
   * @returns The alerts, in the order the store keeps them
   */
  private filtered(filter: AlertHistoryFilter): DeviationAlert[] {
    return filterAlertHistory(this.store.alerts(), filter, this.now(), (alert) =>
      this.textsOf(alert),
    );
  }

  /**
   * Texts of an alert as the person sees them, where the search looks.
   *
   * @param alert - The alert
   * @returns The device, the variable, the environment and the resolution notes
   */
  private textsOf(alert: DeviationAlert): (string | null)[] {
    const environment = this.store.environments().find((item) => item.id === alert.environmentId);
    return [
      this.store.deviceName(alert.equipmentId),
      alertVariableName(this.translate, alert.parameterName),
      environment ? `${environment.code} ${environment.name}` : null,
      alert.resolutionNotes,
    ];
  }

  /**
   * Writes a change of the filter in the address and goes back to the first page.
   *
   * @param changes - What changes in the filter
   * @param replace - Whether to replace the current entry of the history of the browser, as when typing
   */
  private changeFilter(changes: Partial<AlertHistoryFilter>, replace = false): void {
    this.navigate({ ...queryFromFilter({ ...this.filter(), ...changes }), page: null }, replace);
  }

  /**
   * Changes query parameters of the address, keeping the others.
   *
   * @param queryParams - The parameters that change; `null` removes one
   * @param replace - Whether to replace the current entry of the history of the browser
   */
  private navigate(queryParams: Params, replace = false): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: replace,
    });
  }
}

/**
 * Adds a value to a list of chips, or removes it when it was there.
 *
 * @param list - The values pressed
 * @param value - The chip pressed
 * @returns The new list
 */
function toggled<T>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}


