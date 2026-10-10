import { Component, DestroyRef, computed, effect, inject, signal, viewChild } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
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
import { NotificationBell } from '../../../../ca/presentation/components/notification-bell/notification-bell';

/** Entry of the side navigation menu. */
interface NavigationOption {
  label: string;
  icon?: string;
  link: string;
  qualityOnly?: boolean;
  children?: NavigationOption[];
}

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
    RouterLink,
    TranslateModule,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatExpansionModule,
    MatTooltipModule,
    LanguageSwitcher,
    UserSessionSection,
    NotificationBell,
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
   * Navigation options rendered by the layout template. Entries marked qualityOnly (subscription,
   * equipment and staff registration) are reserved to quality managers.
   */
  private readonly options: NavigationOption[] = [
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
        { label: 'nav.products', link: '/batches' },
        { label: 'nav.batch-list', link: '/batches/batch-list' },
      ],
    },
    {
      label: 'nav.equipment',
      icon: 'precision_manufacturing',
      link: '/equipments',
      children: [
        { label: 'nav.equipment-list', link: '/equipments/equipment-list' },
        { label: 'nav.register-equipment', link: '/equipments/register-equipment', qualityOnly: true },
        { label: 'nav.register-device', link: '/equipments/register-device', qualityOnly: true },
      ],
    },
    {
      label: 'nav.alerts',
      icon: 'warning',
      link: '/alerts',
      children: [
        { label: 'nav.alert-dashboard', link: '/alerts/alert-dashboard' },
        { label: 'nav.alert-history', link: '/alerts/alert-history' },
      ],
    },
    {
      label: 'nav.reports',
      icon: 'description',
      link: '/reports',
      children: [
        { label: 'nav.kpi-dashboard', link: '/reports/kpi-dashboard' },
        { label: 'nav.deviation-trends', link: '/reports/deviation-trends' },
        { label: 'nav.report-generator', link: '/reports/report-generator' },
        { label: 'nav.audit-log', link: '/reports/audit-log' },
      ],
    },
    {
      label: 'nav.laboratory',
      icon: 'science',
      link: '/laboratories',
      children: [
        { label: 'nav.lab-profile', link: '/laboratories/lab-profile' },
        { label: 'nav.environments', link: '/laboratories/environments' },
        { label: 'nav.staff-list', link: '/laboratories/staff-list' },
        { label: 'nav.register-staff', link: '/laboratories/staff-form', qualityOnly: true },
      ],
    },
    {
      label: 'nav.inventory',
      icon: 'inventory_2',
      link: '/inventory',
      children: [
        { label: 'nav.raw-material-catalog', link: '/inventory' },
      ],
    },
    {
      label: 'nav.tracking',
      icon: 'sensors',
      link: '/tracking',
      children: [
        { label: 'nav.tracking-monitoring', link: '/tracking/dashboard' },
        { label: 'nav.tracking-history', link: '/tracking/history' },
        { label: 'nav.tracking-profiles', link: '/tracking/profiles' },
      ],
    },
    {
      label: 'nav.subscription',
      icon: 'payments',
      link: '/subscriptions',
      qualityOnly: true,
      children: [
        { label: 'nav.billing-summary', link: '/subscriptions/billing-summary' },
        { label: 'nav.subscription-plans', link: '/subscriptions/plans' },
      ],
    },
  ];

  /**
   * Creates a new Layout component.
   *
   * @param router - Angular router used for navigation and active route checks
   */
  /**
   * Options visible to the signed-in user.
   */
  protected readonly visibleOptions = computed(() => {
    const quality = this.iam.canManageQuality();
    return this.options
      .filter((option) => quality || !option.qualityOnly)
      .map((option) => ({
        ...option,
        children: option.children?.filter((child) => quality || !child.qualityOnly),
      }));
  });

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
