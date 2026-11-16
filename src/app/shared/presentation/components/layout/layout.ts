import {
  Component, DestroyRef, computed, effect, inject, input, signal, viewChild, ChangeDetectionStrategy,
} from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { TranslatePipe } from '@ngx-translate/core';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';

import { LanguageSwitcher } from '../language-switcher/language-switcher';
/** Entry of the side navigation menu. */
interface NavigationOption {
  label: string;
  icon?: string;
  link: string;
  qualityOnly?: boolean;
  children?: NavigationOption[];
}

/** Group of side navigation options; the untitled group stays above the titled ones. */
interface NavigationSection {
  title?: string;
  options: NavigationOption[];
}

/**
 * Main shell layout component for the application.
 *
 * @remarks
 * This component lives in the `shared` bounded context. To maintain the architectural
 * integrity (avoiding circular dependencies), it **must not** import components or
 * stores from other contexts like `iam`, `profile`, or `ca`.
 *
 * Instead, it acts as a purely presentational component. It receives the UI state
 * through `@Input()` signals and uses `<ng-content>` in its template to project
 * the cross-context components (NotificationBell, UserProfileBadge, UserSessionSection).
 *
 * @see app.ts (The root component that wires these dependencies together)
 * @see app.html (Where the projected components are actually passed)
 */
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    TranslatePipe,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    MatExpansionModule,
    MatTooltipModule,
    LanguageSwitcher
  ],
  templateUrl: './layout.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './layout.css',
})
export class Layout {
  /**
   * Material sidenav display mode.
   */
  private readonly breakpoints = inject(BreakpointObserver);


  /**
   * Injected from the App root.
   * Determines if the user is authenticated to show the user session area.
   */
  readonly isSignedIn = input<boolean>(false);

  /**
   * Injected from the App root.
   * Determines if the user has completed onboarding to show the sidebar.
   */
  readonly hasOperationalAccess = input<boolean>(false);

  /**
   * Injected from the App root.
   * Determines if the user is a quality manager to filter the menu options.
   */
  readonly canManageQuality = input<boolean>(false);

  private readonly drawer = viewChild(MatSidenav);
  protected readonly mobile = toSignal(
    this.breakpoints.observe('(max-width: 1023px)').pipe(map((state) => state.matches)),
    { initialValue: this.breakpoints.isMatched('(max-width: 1023px)') },
  );
  protected readonly sidenavMode = computed(() => (this.mobile() ? 'over' : 'side'));

  /** The logo and the name lead to the home page before signing in and to the dashboard afterwards. */
  protected readonly brandLink = computed(() => (this.isSignedIn() ? '/dashboard' : '/home'));

  /** Accessible name of the logo link, following {@link Layout.brandLink}. */
  protected readonly brandLabel = computed(() => (this.isSignedIn() ? 'brand.go-dashboard' : 'brand.go-home'));
  protected readonly sidenavOpened = signal(false);

  /**
   * Navigation sections rendered by the layout template, ordered by how often the laboratory works with them:
   * daily operation first, then quality review and finally administration. Entries marked qualityOnly
   * (subscription, equipment and staff registration) are reserved to quality managers.
   */
  private readonly sections: NavigationSection[] = [
    {
      options: [
        {
          label: 'nav.dashboard',
          icon: 'dashboard',
          link: '/dashboard',
        },
      ],
    },
    {
      title: 'nav.section.operation',
      options: [
        {
          label: 'nav.batches',
          icon: 'inventory',
          link: '/batches',
          children: [
            { label: 'nav.products', link: '/batches/environments' },
            { label: 'nav.batch-list', link: '/batches' },
          ],
        },
        {
          label: 'nav.equipment',
          icon: 'precision_manufacturing',
          link: '/equipments',
          children: [
            { label: 'nav.equipment-list', link: '/equipments' },
            {
              label: 'nav.register-equipment',
              link: '/equipments/new',
              qualityOnly: true,
            },
            { label: 'nav.register-device', link: '/equipments/devices/new', qualityOnly: true },
            { label: 'nav.register-edge-gateway', link: '/equipments/edge-gateways/new', qualityOnly: true },
          ],
        },
        {
          label: 'nav.tracking',
          icon: 'sensors',
          link: '/tracking',
          children: [
            { label: 'nav.tracking-monitoring', link: '/tracking/monitoring' },
            { label: 'nav.tracking-history', link: '/tracking/history' },
            { label: 'nav.tracking-profiles', link: '/tracking/profiles' },
          ],
        },
        {
          label: 'nav.alerts',
          icon: 'warning',
          link: '/alerts',
          children: [
            { label: 'nav.alert-dashboard', link: '/alerts' },
            { label: 'nav.alert-history', link: '/alerts/history' },
            { label: 'nav.alert-preferences', link: '/alerts/notification-settings' },
          ],
        },
        {
          label: 'nav.inventory',
          icon: 'inventory_2',
          link: '/inventory',
          children: [{ label: 'nav.raw-material-catalog', link: '/inventory' }],
        },
      ],
    },
    {
      title: 'nav.section.quality',
      options: [
        {
          label: 'nav.reports',
          icon: 'description',
          link: '/reports',
          children: [
            { label: 'nav.kpi-dashboard', link: '/reports/kpis' },
            { label: 'nav.deviation-trends', link: '/reports/deviation-trends' },
            { label: 'nav.report-generator', link: '/reports/new' },
            { label: 'nav.audit-log', link: '/reports/audit-log' },
          ],
        },
      ],
    },
    {
      title: 'nav.section.administration',
      options: [
        {
          label: 'nav.laboratory',
          icon: 'science',
          link: '/laboratories',
          children: [
            { label: 'nav.lab-profile', link: '/laboratories/profile' },
            { label: 'nav.environments', link: '/laboratories/environments' },
            { label: 'nav.staff-list', link: '/laboratories/staff' },
            { label: 'nav.register-staff', link: '/laboratories/staff/new', qualityOnly: true },
          ],
        },
        {
          label: 'nav.subscription',
          icon: 'payments',
          link: '/subscriptions',
          qualityOnly: true,
          children: [
            { label: 'nav.billing-summary', link: '/subscriptions/billing' },
            { label: 'nav.subscription-plans', link: '/subscriptions/plans' },
          ],
        },
      ],
    },
  ];

  /**
   * Computed signal that filters the navigation sections based on the user's role.
   * A section whose options are all reserved to quality managers is hidden with them.
   */
  protected readonly visibleSections = computed(() => {
    const quality = this.canManageQuality();
    return this.sections
      .map((section) => ({
        ...section,
        options: section.options
          .filter((option) => quality || !option.qualityOnly)
          .map((option) => ({
            ...option,
            children: option.children?.filter((child) => quality || !child.qualityOnly),
          })),
      }))
      .filter((section) => section.options.length > 0);
  });
  constructor(private readonly router: Router) {
    effect(() => this.sidenavOpened.set(!this.mobile() && this.hasOperationalAccess()));
    router.events
      .pipe(filter((event) => event instanceof NavigationEnd), takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(() => { if (this.mobile()) void this.drawer()?.close(); });
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
   * @returns True when the path of the current URL matches or belongs to the route group; its query parameters and
   * fragment do not count, because they only narrow what the same page shows
   */
  protected isActive(link: string): boolean {
    const path = this.router.url.split(/[?#]/)[0];
    return path === link || path.startsWith(`${link}/`);
  }

  /**
   * Finds the sub-option that owns the current URL.
   *
   * @remarks
   * Semantic routes nest resources (`/alerts` and `/alerts/history`), so several sub-options can match the URL;
   * the most specific one is the active one.
   *
   * @param option - Option whose sub-options are compared
   * @returns The link of the most specific active sub-option, or undefined when none is active
   */
  protected activeChildLink(option: NavigationOption): string | undefined {
    return option.children
      ?.filter((child) => this.isActive(child.link))
      .reduce<string | undefined>((best, child) => (child.link.length > (best?.length ?? -1) ? child.link : best), undefined);
  }
}
