import {
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

import { LaboratoryStore } from '../../../application/laboratory.store';
import { IamStore } from '../../../../iam/application/iam.store';
import { StaffMember } from '../../../domain/model/staff-member.entity';
import { TablePaginator, paginate } from '../../../../shared/presentation/components/table-paginator/table-paginator';
import { PageHeader } from '../../../../shared/presentation/components/page-header/page-header';
import { ListToolbar } from '../../../../shared/presentation/components/list-toolbar/list-toolbar';
import { FilterChip } from '../../../../shared/presentation/components/filter-chip/filter-chip';
import { LABORATORY_TABS } from '../../laboratory-tabs';

/** Which staff members the list shows. */
type StatusFilter = 'all' | 'active' | 'inactive';

/**
 * Component responsible for displaying and managing laboratory staff members.
 *
 * @remarks
 * This presentation component loads staff members for the current laboratory. Quality managers
 * register and deactivate them, and open the activity history of each one from their name.
 */
@Component({
  selector: 'app-staff-list',
  standalone: true,
  imports: [
    TablePaginator, RouterLink,
    TranslatePipe,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    PageHeader,
    ListToolbar,
    FilterChip,
  ],
  templateUrl: './staff-list.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './staff-list.css',
})
export class StaffList implements OnInit {
  /** Page of the table shown; ten rows unless the person chooses more. */
  protected readonly staffPage = paginate(() => this.visibleStaff());

  /** Operations of the laboratory module. */
  protected readonly tabs = LABORATORY_TABS;

  /** Whether the list shows everyone, only the active members or only the inactive ones. */
  protected readonly status = signal<StatusFilter>('all');

  /** Text searched in the name, the job title and the email of the members. */
  protected readonly search = signal('');

  /** Chips of the status, with the key of their name. */
  protected readonly statusOptions: readonly { value: StatusFilter; labelKey: string }[] = [
    { value: 'all', labelKey: 'common.all' },
    { value: 'active', labelKey: 'common.active' },
    { value: 'inactive', labelKey: 'common.inactive' },
  ];

  /** How many members each status chip holds. */
  protected readonly counts = computed(() => {
    const staff = this.store.staffList();
    const active = staff.filter((member) => member.active).length;
    return { all: staff.length, active, inactive: staff.length - active };
  });

  /** Members of the chosen status whose name, job title or email contains the searched text. */
  protected readonly visibleStaff = computed(() => {
    const status = this.status();
    const text = this.search().trim().toLowerCase();
    return this.store
      .staffList()
      .filter((member) => status === 'all' || member.active === (status === 'active'))
      .filter(
        (member) =>
          !text ||
          [member.fullName, member.role, member.email].some((value) => (value ?? '').toLowerCase().includes(text)),
      );
  });

  /**
   * Store that manages Laboratory bounded context state.
   */
  protected readonly store = inject(LaboratoryStore);

  /**
   * Store that exposes authenticated user context.
   */
  protected readonly iamStore = inject(IamStore);

  /**
   * Router used to navigate after user actions.
   */
  private readonly router = inject(Router);

  /**
   * Translation service used for the deactivation confirmation.
   */
  private readonly translate = inject(TranslateService);

  /**
   * Reference used to stop the deactivation requests when the view is destroyed.
   */
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Translation key of the last failed action.
   */
  protected readonly error = signal<string | null>(null);

  /**
   * Quality managers and auditors can open the activity history of a staff member.
   */
  protected readonly canSeeActivity = computed(
    () => this.iamStore.canManageQuality() || this.iamStore.isAuditor(),
  );

  /**
   * Reads the staff members of the current laboratory again.
   */
  protected refresh(): void {
    this.store.loadStaff(this.iamStore.requireLaboratoryId());
  }

  /**
   * Lifecycle hook that loads staff members for the current laboratory.
   */
  ngOnInit(): void {
    this.store.loadStaff(this.iamStore.requireLaboratoryId());
  }

  /**
   * Navigates to the staff registration form.
   */
  protected onRegister(): void {
    void this.router.navigate(['/laboratories/staff/new']);
  }

  /**
   * Deactivates a staff member after user confirmation; they can no longer sign in.
   *
   * @param member - Staff member to deactivate
   */
  protected onDeactivate(member: StaffMember): void {
    if (
      !confirm(this.translate.instant('staff-list.deactivate-confirm', { name: member.fullName }))
    )
      return;
    this.error.set(null);
    this.store
      .deactivateStaff(this.iamStore.requireLaboratoryId(), member.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ error: () => this.error.set('staff-list.deactivate-error') });
  }
}
