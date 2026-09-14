import { Component, DestroyRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { IamStore } from '../../../../iam/application/iam.store';
import { LaboratoryStore } from '../../../../laboratory/application/laboratory.store';
import { EquipmentStore } from '../../../../equipment/application/equipment.store';
import { BatchStore } from '../../../../batch/application/batch.store';
import { CaStore } from '../../../../ca/application/ca.store';
import { RaStore } from '../../../../ra/application/ra.store';
import { TrackingStore } from '../../../../tracking/application/tracking.store';
import { SubscriptionStore } from '../../../../subscription/application/subscription.store';
import { TranslateModule } from '@ngx-translate/core';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';

import { LanguageSwitcher } from '../language-switcher/language-switcher';
import { UserSessionSection } from '../../../../iam/presentation/components/user-session-section/user-session-section';

/**
 * Layout component for the main application shell.
 *
 * @remarks
 * Provides the fixed toolbar, side navigation menu, authenticated user section,
 * language switcher, and routed content outlet. Routes that require path
 * parameters are excluded from the menu to avoid navigating users to not-found
 * pages.
 */
@Component({
  selector: 'app-layout',
  standalone: true,
  providers: [LaboratoryStore, EquipmentStore, BatchStore, CaStore, RaStore, TrackingStore, SubscriptionStore],
  imports: [
    RouterOutlet,
    TranslateModule,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatExpansionModule,
    MatTooltipModule,
    LanguageSwitcher,
    UserSessionSection,
  ],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
})
export class Layout {
  /**
   * Material sidenav display mode.
   */
  private readonly breakpoints = inject(BreakpointObserver);
  private readonly iam = inject(IamStore);
  private readonly drawer = viewChild(MatSidenav);
  protected readonly mobile = toSignal(this.breakpoints.observe('(max-width: 1023px)').pipe(
    map((state) => state.matches)), { initialValue: this.breakpoints.isMatched('(max-width: 1023px)') });
  protected readonly sidenavMode = computed(() => this.mobile() ? 'over' : 'side');
  protected readonly hasOperationalAccess = computed(() => this.iam.onboarding()?.nextStep === 'READY');

  /**
   * Indicates whether the sidenav starts opened.
   */
  protected readonly sidenavOpened = signal(false);

  /**
   * Navigation options rendered by the layout template.
   */
  protected readonly options = [
    {
      label: 'nav.dashboard',
      icon: 'dashboard',
      link: '/dashboard',
    },
    {
      label: 'nav.batches',
      icon: 'inventory',
      link: '/batches',
      children: [
        { label: 'batches.title', link: '/batches/batch-list' },
        { label: 'batches.add-button', link: '/batches/batch-form' },
      ],
    },
    {
      label: 'nav.equipment',
      icon: 'precision_manufacturing',
      link: '/equipments',
      children: [
        { label: 'equipment-list.title', link: '/equipments/equipment-list' },
        { label: 'equipment-list.add-button', link: '/equipments/register-equipment' },
      ],
    },
    {
      label: 'nav.alerts',
      icon: 'warning',
      link: '/alerts',
      children: [
        { label: 'ca-alerts.subtitle', link: '/alerts/alert-dashboard' },
        { label: 'ca-alerts.history.title', link: '/alerts/alert-history' },
        { label: 'ca-alerts.settings.title', link: '/alerts/notification-settings' },
      ],
    },
    {
      label: 'nav.reports',
      icon: 'description',
      link: '/reports',
      children: [
        { label: 'kpi-dashboard.title', link: '/reports/kpi-dashboard' },
        { label: 'deviation-trend.title', link: '/reports/deviation-trends' },
        { label: 'report-generator.title', link: '/reports/report-generator' },
        { label: 'audit-log.title', link: '/reports/audit-log' },
      ],
    },
    {
      label: 'nav.laboratory',
      icon: 'science',
      link: '/laboratories',
      children: [
        { label: 'lab-profile.title', link: '/laboratories/lab-profile' },
        { label: 'staff-list.title', link: '/laboratories/staff-list' },
        { label: 'staff-form.title', link: '/laboratories/staff-form' },
        { label: 'product-catalog.title', link: '/laboratories/product-catalog' },
        { label: 'product-form.title', link: '/laboratories/product-form' },
      ],
    },
    {
      label: 'inventory.title',
      icon: 'inventory_2',
      link: '/inventory',
    },
    {
      label: 'nav.tracking',
      icon: 'sensors',
      link: '/tracking',
      children: [
        { label: 'tracking.dashboard.title', link: '/tracking/dashboard' },
        { label: 'tracking.history.title', link: '/tracking/history' },
        { label: 'tracking.analysis.title', link: '/tracking/analysis' },
      ],
    },
    {
      label: 'nav.subscription',
      icon: 'payments',
      link: '/subscriptions',
      children: [
        { label: 'subscription.billing.title', link: '/subscriptions/billing-summary' },
        { label: 'subscription.plans.title', link: '/subscriptions/plans' },
      ],
    },
  ];

  /**
   * Creates a new Layout component.
   *
   * @param router - Angular router used for navigation and active route checks
   */
  constructor(private readonly router: Router) {
    effect(() => this.sidenavOpened.set(!this.mobile() && this.hasOperationalAccess()));
    router.events.pipe(filter((event) => event instanceof NavigationEnd),
      takeUntilDestroyed(inject(DestroyRef))).subscribe(() => {
        if (this.mobile()) void this.drawer()?.close();
    });
  }

  /**
   * Navigates to a route from the side menu.
   *
   * @param link - Target route link
   */
  protected navigateTo(link: string): void {
    this.router.navigate([link]).then();
  }

  /**
   * Determines whether a route or route group is currently active.
   *
   * @param link - Route link to compare against the current URL
   * @returns True when the current URL matches or belongs to the route group
   */
  protected isActive(link: string): boolean {
    return this.router.url === link || this.router.url.startsWith(`${link}/`);
  }
}
