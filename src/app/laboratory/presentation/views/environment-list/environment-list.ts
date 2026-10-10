import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { EnvironmentStore } from '../../../application/environment.store';
import { Environment } from '../../../domain/model/environment.entity';
import { ENVIRONMENT_USAGES, EnvironmentUsage } from '../../../domain/model/environment-usage';

/**
 * Component that lists the environments of the current laboratory (US32).
 *
 * @remarks
 * Quality managers can register and edit environments and assign their usage (US30, US31, US33);
 * other members of the laboratory can only consult them.
 */
@Component({
  selector: 'app-environment-list',
  standalone: true,
  imports: [
    TranslateModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './environment-list.html',
  styleUrl: './environment-list.css',
})
export class EnvironmentList implements OnInit {
  /**
   * Store that manages the environments of the current laboratory.
   */
  protected readonly store = inject(EnvironmentStore);

  /**
   * Router used to navigate after user actions.
   */
  private readonly router = inject(Router);

  /**
   * Usages offered in the usage assignment menu.
   */
  protected readonly usages = ENVIRONMENT_USAGES;

  /**
   * Columns displayed in the environment table; the actions are only shown to quality managers.
   */
  protected get displayedColumns(): string[] {
    return this.store.canManage()
      ? ['code', 'name', 'usage', 'description', 'actions']
      : ['code', 'name', 'usage', 'description'];
  }

  /**
   * Lifecycle hook that loads the environments of the current laboratory.
   */
  ngOnInit(): void {
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
    void this.store.assignUsage(environment.id, usage);
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
