import { Component, OnInit, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

import { LaboratoryStore } from '../../../application/laboratory.store';
import { Environment } from '../../../domain/model/environment.entity';
import { ENVIRONMENT_USAGES, EnvironmentUsage } from '../../../domain/model/environment-usage';
import { TablePaginator, paginate } from '../../../../shared/presentation/components/table-paginator/table-paginator';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { ListToolbar } from '../../../../shared/presentation/components/list-toolbar/list-toolbar';
import { FilterChip } from '../../../../shared/presentation/components/filter-chip/filter-chip';
import { LABORATORY_TABS } from '../../laboratory-tabs';

/** Which environments the list shows: all of them, those of one usage, or those without one. */
type UsageFilter = 'all' | EnvironmentUsage | 'none';

/**
 * Component that lists the environments of the current laboratory (US32).
 *
 * @remarks
 * Quality managers can register and edit environments and assign their usage (US30, US31, US33);
 * other members of the laboratory can only consult them. The code of each environment links to
 * the equipment, IoT devices and Edge Gateways located in it.
 */
@Component({
  selector: 'app-environment-list',
  standalone: true,
  imports: [
    TablePaginator, RouterLink,
    TranslatePipe,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    PageHeader,
    ListToolbar,
    FilterChip,
  ],
  templateUrl: './environment-list.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './environment-list.css',
})
export class EnvironmentList implements OnInit {
  /** Page of the table shown; ten rows unless the person chooses more. */
  protected readonly environmentPage = paginate(() => this.visibleEnvironments());

  /** Operations of the laboratory module. */
  protected readonly tabs = LABORATORY_TABS;

  /** Usage the list is narrowed to. */
  protected readonly usage = signal<UsageFilter>('all');

  /** Text searched in the code and the name of the environments. */
  protected readonly search = signal('');

  /** Chips of the usages present, each with how many environments have it. */
  protected readonly usageOptions = computed(() => {
    const environments = this.store.environments();
    const options: { value: UsageFilter; labelKey: string; count: number }[] = [
      { value: 'all', labelKey: 'common.all', count: environments.length },
    ];
    for (const value of [...ENVIRONMENT_USAGES, 'none' as const]) {
      const count = environments.filter((environment) => (environment.usage ?? 'none') === value).length;
      if (count || this.usage() === value) {
        options.push({ value, labelKey: this.usageKey(value === 'none' ? null : value), count });
      }
    }
    return options;
  });

  /** Environments of the chosen usage whose code or name contains the searched text. */
  protected readonly visibleEnvironments = computed(() => {
    const usage = this.usage();
    const text = this.search().trim().toLowerCase();
    return this.store
      .environments()
      .filter((environment) => usage === 'all' || (environment.usage ?? 'none') === usage)
      .filter(
        (environment) =>
          !text || [environment.code, environment.name].some((value) => value.toLowerCase().includes(text)),
      );
  });

  /**
   * Store that manages the environments of the current laboratory.
   */
  protected readonly store = inject(LaboratoryStore);

  /**
   * Router used to navigate after user actions.
   */
  private readonly router = inject(Router);

  /**
   * Usages offered in the usage assignment menu.
   */
  protected readonly usages = ENVIRONMENT_USAGES;

  /**
   * Lifecycle hook that loads the environments of the current laboratory.
   */
  ngOnInit(): void {
    void this.store.loadEnvironments();
  }

  /**
   * Reads the environments of the current laboratory again.
   */
  protected refresh(): void {
    void this.store.loadEnvironments();
  }

  /**
   * Navigates to the environment registration form.
   */
  protected onRegister(): void {
    void this.router.navigate(['/laboratories/environments/new']);
  }

  /**
   * Navigates to the edition form of an environment.
   *
   * @param environment - Environment to edit
   */
  protected onEdit(environment: Environment): void {
    void this.router.navigate(['/laboratories/environments', environment.id, 'edit']);
  }

  /**
   * Assigns the main use of an environment.
   *
   * @param environment - Environment whose usage changes
   * @param usage - Usage to assign
   */
  protected onAssignUsage(environment: Environment, usage: EnvironmentUsage): void {
    void this.store.assignEnvironmentUsage(environment.id, usage);
  }

  /**
   * Returns the translation key of a usage.
   *
   * @param usage - Usage of the environment, or `null` when not assigned
   * @returns Translation key of the usage, or of the "not assigned" label
   */
  protected usageKey(usage: EnvironmentUsage | null): string {
    return usage ? `environment-usage.${usage}` : 'environments.usage-not-assigned';
  }
}
