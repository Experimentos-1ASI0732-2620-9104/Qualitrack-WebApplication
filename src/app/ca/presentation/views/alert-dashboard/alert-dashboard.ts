import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  OnInit,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChildren,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ActivatedRoute, Router, RouterLink, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { filter, fromEvent, interval, map, merge, timer } from 'rxjs';

import { ActionBanner } from '../../../../shared/presentation/components/action-banner/action-banner';
import { EmptyState } from '../../../../shared/presentation/components/empty-state/empty-state';
import { EnvironmentSelector } from '../../../../shared/presentation/components/environment-selector/environment-selector';
import { ErrorBanner } from '../../../../shared/presentation/components/error-banner/error-banner';
import { FilterChip } from '../../../../shared/presentation/components/filter-chip/filter-chip';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { ListToolbar } from '../../../../shared/presentation/components/list-toolbar/list-toolbar';
import { CaStore } from '../../../application/ca.store';
import {
  compareAlertsByNewest,
  compareAlertsByPriority,
} from '../../../domain/model/alert-priority';
import { AlertSeverity, DeviationAlert } from '../../../domain/model/deviation-alert.entity';
import { AlertAttentionFlow } from '../../alert-attention-flow';
import { alertVariableName } from '../../alert-variable';
import { AlertCard } from '../../components/alert-card/alert-card';
import { alertTabs } from '../../alert-tabs';
import { SetupNotice } from '../../../../shared/presentation/components/setup-notice/setup-notice';
import { IamStore } from '../../../../iam/application/iam.store';

/** How often the open alerts are read again, the same as the bell. */
const REFRESH_INTERVAL_MS = 30_000;

/** How often the texts that tell how long ago something happened are brought up to date. */
const CLOCK_INTERVAL_MS = 1000;

/** Orders the inbox offers. */
type AlertSortOrder = 'priority' | 'newest' | 'environment';

/** Which alerts the attention filter leaves. */
type AttentionFilter = 'unattended' | 'attending';

/** Chips of the inbox: each one leaves a part of the open alerts, and only one is pressed at a time. */
type InboxChip = 'all' | 'critical-unattended' | 'unattended' | 'attending';

/** Order of the groups of the inbox, the most serious first. */
const SEVERITY_ORDER: readonly AlertSeverity[] = ['CRITICAL', 'WARNING', 'LOW'];

/** Removes accents and capitals, so nobody has to type a name exactly as it is stored. */
function searchable(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/**
 * Prioritized inbox of the open alerts of the laboratory (US85): the most urgent first, across every environment
 * unless the person narrows it to one, so that a critical alert is never hidden behind a selector.
 *
 * @remarks
 * The alerts are grouped by severity, and one chip at a time narrows them to what needs attention. The chosen environment
 * lives in the `environmentId` query parameter; without it, every environment is shown. The list
 * refreshes itself while the tab is visible and attention registered from here can be undone for a few seconds. The
 * detail of an alert opens in a panel over the list, which stays as it was. With the focus on the list, J and K move
 * between the cards and A attends the one that has it; they only work there so they cannot get in the way of a person
 * using dictation or a screen reader elsewhere on the page (WCAG 2.1.4).
 */
@Component({
  selector: 'app-alert-dashboard',
  standalone: true,
  imports: [
    SetupNotice,
    FilterChip,
    RouterLink,
    RouterOutlet,
    TranslatePipe,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
    ActionBanner,
    AlertCard,
    PageHeader,
    ListToolbar,
    EmptyState,
    EnvironmentSelector,
    ErrorBanner,
  ],
  templateUrl: './alert-dashboard.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './alert-dashboard.css',
})
export class AlertDashboard implements OnInit {
  /** Store that holds the alerts shown by the inbox. */
  protected readonly store = inject(CaStore);
  protected readonly iam = inject(IamStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly translate = inject(TranslateService);
  private readonly attentionFlow = inject(AlertAttentionFlow);
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly injector = inject(Injector);
  private readonly document = inject(DOCUMENT);
  private readonly cards = viewChildren(AlertCard);

  private readonly queryParams = toSignal(this.route.queryParamMap);

  /** Environment chosen, or null for every environment; an unknown one in the address counts as none. */
  protected readonly environmentId = computed(() => {
    const environmentId = Number(this.queryParams()?.get('environmentId'));
    return this.store.environments().some((environment) => environment.id === environmentId)
      ? environmentId
      : null;
  });

  /** Operations of the module, keeping the environment chosen. */
  protected readonly tabs = computed(() => alertTabs(this.environmentId()));

  /** What the inbox reads: the environment chosen or, without one, every environment that exists. */
  private readonly scope = computed(() => {
    const environmentId = this.environmentId();
    return environmentId === null
      ? `all:${this.store.environments().map((environment) => environment.id).join()}`
      : `one:${environmentId}`;
  });

  /** Current time, to tell how long ago things happened. */
  protected readonly now = toSignal(interval(CLOCK_INTERVAL_MS).pipe(map(() => new Date())), {
    initialValue: new Date(),
  });

  /** Orders of the inbox, with the key of their name. */
  private readonly allSortOrders: readonly { order: AlertSortOrder; labelKey: string }[] = [
    { order: 'priority', labelKey: 'ca-alerts.active.sort.priority' },
    { order: 'newest', labelKey: 'ca-alerts.active.sort.newest' },
    { order: 'environment', labelKey: 'ca-alerts.active.sort.environment' },
  ];

  /** Orders offered: by environment only while the inbox shows every environment. */
  protected readonly sortOrders = computed(() =>
    this.environmentId() === null
      ? this.allSortOrders
      : this.allSortOrders.filter((option) => option.order !== 'environment'),
  );

  /** Order the person chose, kept while it cannot be used so it comes back with every environment. */
  protected readonly sortOrder = signal<AlertSortOrder>('priority');

  /** Order in use: by priority instead of by environment while one environment is shown. */
  protected readonly appliedSortOrder = computed<AlertSortOrder>(() =>
    this.sortOrder() === 'environment' && this.environmentId() !== null ? 'priority' : this.sortOrder(),
  );
  protected readonly criticalOnly = signal(false);
  protected readonly attentionFilter = signal<AttentionFilter | null>(null);
  protected readonly searchTerm = signal('');

  /** Whether the detail of an alert is open over the list; it shows its own messages then. */
  protected readonly detailOpen = signal(false);

  /** Open alerts of the scope: an alert resolved from here is still in the list until the next refresh. */
  private readonly openAlerts = computed(() => this.store.alerts().filter((alert) => alert.isOpen));

  private readonly unattendedAlerts = computed(() =>
    this.openAlerts()
      .filter((alert) => alert.status === 'UNRESOLVED')
      .sort(compareAlertsByPriority),
  );

  private readonly attendingAlerts = computed(() =>
    this.openAlerts().filter((alert) => alert.status === 'ACKNOWLEDGED'),
  );

  /** Whether any filter narrows the list. */
  protected readonly isFiltered = computed(
    () => this.criticalOnly() || this.attentionFilter() !== null || this.searchTerm().trim() !== '',
  );

  /** Alerts of the list, once filtered and ordered. */
  protected readonly visibleAlerts = computed(() => {
    const attentionFilter = this.attentionFilter();
    const term = searchable(this.searchTerm().trim());
    const alerts = this.openAlerts().filter(
      (alert) =>
        (!this.criticalOnly() || alert.severity === 'CRITICAL') &&
        (!attentionFilter ||
          (attentionFilter === 'unattended') === (alert.status === 'UNRESOLVED')) &&
        (!term || this.matchesSearch(alert, term)),
    );
    return alerts.sort(this.comparator());
  });

  /** The alerts of the list in groups by severity, the most serious first; a group without alerts is left out. */
  protected readonly groups = computed(() =>
    SEVERITY_ORDER.map((severity) => ({
      severity,
      alerts: this.visibleAlerts().filter((alert) => alert.severity === severity),
    })).filter((group) => group.alerts.length),
  );

  /** Chip pressed, read from the filters it sets. */
  protected readonly chip = computed<InboxChip>(() => {
    const attentionFilter = this.attentionFilter();
    if (this.criticalOnly()) return 'critical-unattended';
    return attentionFilter ?? 'all';
  });

  /** Critical alerts nobody attends, which the red chip counts. */
  protected readonly unattendedCriticalCount = computed(
    () => this.unattendedAlerts().filter((alert) => alert.severity === 'CRITICAL').length,
  );

  /** What the chips and the tab count: every open alert, the ones nobody attends and the ones in progress. */
  protected readonly stats = computed(() => ({
    open: this.openAlerts().length,
    unattended: this.unattendedAlerts().length,
    attending: this.attendingAlerts().length,
  }));

  /** Names of the environments that could not be read, for the warning that says so. */
  protected readonly unavailableEnvironments = computed(() => {
    const unavailableIds = this.store.unavailableEnvironmentIds();
    return this.store
      .environments()
      .filter((environment) => unavailableIds.includes(environment.id))
      .map((environment) => environment.code)
      .join(', ');
  });

  /** Whether the list can be trusted to be empty because there are no alerts. */
  protected readonly isAllClear = computed(
    () =>
      !this.store.loading() &&
      this.store.environmentsLoaded() &&
      !this.store.unavailableEnvironmentIds().length &&
      !this.openAlerts().length,
  );

  /** How many environments the empty state speaks of. */
  protected readonly scopeEnvironmentCount = computed(() =>
    this.environmentId() === null ? this.store.environments().length : 1,
  );

  constructor() {
    effect(() => {
      this.scope();
      if (this.store.environmentsLoaded())
        untracked(() => this.store.loadOpenAlerts(this.environmentId()));
    });

    effect(() => {
      const count = this.store.newAlertIds().size;
      if (count)
        void this.liveAnnouncer.announce(
          this.translate.instant('ca-alerts.active.new-alerts', { count }),
          'polite',
        );
    });

    merge(
      timer(REFRESH_INTERVAL_MS, REFRESH_INTERVAL_MS),
      fromEvent(this.document, 'visibilitychange'),
    )
      .pipe(
        filter(() => !this.document.hidden),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.refresh());
  }

  /**
   * Clears what a previous view left and loads the devices and the environments.
   *
   * @remarks
   * The environments are read every time, because one can be created while the application is open. The alerts follow
   * the environment chosen as soon as the environments are known, and are read again if a new environment appears.
   */
  async ngOnInit(): Promise<void> {
    this.store.clearError();
    this.store.clearAlerts();
    this.store.loadDevices();
    this.store.loadPeople();
    await this.store.loadEnvironments();
  }

  /**
   * Narrows the inbox to an environment and remembers it as the one the person prefers.
   *
   * @param environmentId - The environment chosen
   */
  protected chooseEnvironment(environmentId: number): void {
    this.store.rememberEnvironment(environmentId);
    void this.router.navigate([], { relativeTo: this.route, queryParams: { environmentId } });
  }

  /** Goes back to every environment; that choice is not remembered, it is what the inbox opens with. */
  protected chooseAllEnvironments(): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  /** Reads the alerts again, or the environments if they could not be read. */
  protected refresh(): void {
    if (this.store.environmentsLoaded()) this.store.refreshOpenAlerts(this.environmentId());
    else void this.store.loadEnvironments();
  }

  /** Shows every open alert, removing the filters. */
  protected clearFilters(): void {
    this.criticalOnly.set(false);
    this.attentionFilter.set(null);
    this.searchTerm.set('');
  }

  /**
   * Leaves the part of the open alerts a chip stands for; pressing the chip already pressed goes back to every alert.
   *
   * @param chip - The chip the person pressed
   */
  protected selectChip(chip: InboxChip): void {
    const next = chip === this.chip() ? 'all' : chip;
    this.criticalOnly.set(next === 'critical-unattended');
    this.attentionFilter.set(next === 'all' ? null : next === 'critical-unattended' ? 'unattended' : next);
  }

  /**
   * Registers that the person attends an alert, giving a few seconds to undo it.
   *
   * @param alert - The alert
   */
  protected attend(alert: DeviationAlert): void {
    this.attentionFlow.attend(alert);
    this.focusPrimaryActionOf(alert);
  }

  /**
   * Closes the time to undo when the person moves on with the alert that is waiting for it.
   *
   * @param alert - The alert the person is working with
   */
  protected closeUndoWindow(alert: DeviationAlert): void {
    this.attentionFlow.closeUndoWindow(alert.id);
  }

  /**
   * E-mails the alert again.
   *
   * @param alert - The alert
   */
  protected notify(alert: DeviationAlert): void {
    this.closeUndoWindow(alert);
    this.store.sendAlertEmailNotification(alert.id);
  }

  /**
   * Moves through the list with J and K, and attends the alert that has the focus with A.
   *
   * @param event - The key pressed with the focus on the list
   */
  protected handleListShortcut(event: KeyboardEvent): void {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const position = this.cards().findIndex((card) => card.contains(event.target as Node));
    if (position < 0) return;
    const alert = this.cards()[position].alert();
    switch (event.key.toLowerCase()) {
      case 'j':
        this.cards()[position + 1]?.focus();
        break;
      case 'k':
        this.cards()[position - 1]?.focus();
        break;
      case 'a':
        if (this.store.canAttend() && alert.status === 'UNRESOLVED') this.attend(alert);
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  /** The panel closed: if what had the focus before it is gone, such as the card of a resolved alert, the list takes it. */
  protected detailClosed(): void {
    this.detailOpen.set(false);
    afterNextRender(
      () => {
        if (this.document.activeElement === this.document.body) this.cards()[0]?.focus();
      },
      { injector: this.injector },
    );
  }

  /**
   * Name of the person attending an alert.
   *
   * @param alert - The alert
   * @returns The name, or null while it is unknown
   */
  protected attendedByOf(alert: DeviationAlert): string | null {
    return this.store.personName(alert.acknowledgedBy);
  }

  /**
   * Code and name of the environment of an alert.
   *
   * @param alert - The alert
   * @returns The label, or null when the environment is unknown
   */
  protected environmentLabelOf(alert: DeviationAlert): string | null {
    const environment = this.store.environments().find((item) => item.id === alert.environmentId);
    return environment ? `${environment.code} · ${environment.name}` : null;
  }

  /**
   * Name of the device that detected the deviation of an alert.
   *
   * @param alert - The alert
   * @returns The name, or the identifier while it is unknown
   */
  private deviceLabelOf(alert: DeviationAlert): string {
    return this.store.deviceName(alert.equipmentId) ?? `#${alert.equipmentId}`;
  }

  /**
   * Name of the variable that deviated in an alert.
   *
   * @param alert - The alert
   * @returns The translated name
   */
  private variableOf(alert: DeviationAlert): string {
    return alertVariableName(this.translate, alert.parameterName);
  }

  private titleOf(alert: DeviationAlert): string {
    return `${this.variableOf(alert)} · ${this.deviceLabelOf(alert)}`;
  }

  private matchesSearch(alert: DeviationAlert, term: string): boolean {
    return searchable(this.titleOf(alert)).includes(term);
  }

  /** How the chosen order compares two alerts. */
  private comparator(): (first: DeviationAlert, second: DeviationAlert) => number {
    switch (this.appliedSortOrder()) {
      case 'newest':
        return compareAlertsByNewest;
      case 'environment':
        return (first, second) =>
          (this.environmentLabelOf(first) ?? '').localeCompare(
            this.environmentLabelOf(second) ?? '',
          ) || compareAlertsByPriority(first, second);
      default:
        return compareAlertsByPriority;
    }
  }

  /** The action just pressed disappears and the card may move, so the focus goes to the next action of the card. */
  private focusPrimaryActionOf(alert: DeviationAlert): void {
    afterNextRender(
      () =>
        this.cards()
          .find((card) => card.alert().id === alert.id)
          ?.focusPrimaryAction(),
      { injector: this.injector },
    );
  }
}
