import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';
import { SubscriptionStore } from '../../../application/subscription.store';
import { Subscription } from '../../../domain/model/subscription.entity';
import { SubscriptionPlan } from '../../../domain/model/subscription-plan.entity';
import { PlanList } from './plan-list';

describe('PlanList', () => {
  function planOf(id: number, code: string, name: string, billingPeriod: 'MONTHLY' | 'YEARLY') {
    return new SubscriptionPlan({
      id,
      code,
      name,
      description: '',
      priceAmount: 199,
      currency: 'USD',
      billingPeriod,
      maxUsers: 10,
      maxEquipment: 5,
      features: [],
      active: true,
    });
  }

  const plan = planOf(2, 'BASIC', 'Standard Lab', 'YEARLY');
  const catalog = [
    planOf(1, 'BASIC', 'Standard Lab', 'MONTHLY'),
    planOf(3, 'ENTERPRISE', 'Enterprise', 'MONTHLY'),
    plan,
    planOf(4, 'ENTERPRISE', 'Enterprise', 'YEARLY'),
  ];
  const plans = signal<SubscriptionPlan[]>([plan]);
  const selectedPlan = signal<SubscriptionPlan | null>(null);
  const currentSubscription = signal<Partial<Subscription> | null>(null);
  const status = signal<'ACTIVE' | 'INACTIVE' | null>('INACTIVE');
  const laboratoryId = signal<number | null>(null);
  const loadCurrentPlan = vi.fn();
  let navigate: ReturnType<typeof vi.spyOn>;

  function paid(overrides: Partial<Subscription> = {}): Partial<Subscription> {
    return {
      id: 9,
      laboratoryId: 42,
      planCode: 'BASIC',
      billingCycle: 'MONTHLY',
      status: 'ACTIVE',
      currentPeriodEnd: '2026-12-04T23:51:00Z',
      cancelAtPeriodEnd: false,
      ...overrides,
    };
  }

  function create() {
    TestBed.configureTestingModule({
      imports: [PlanList],
      providers: [
        provideTranslateService(),
        provideRouter([]),
        {
          provide: SubscriptionStore,
          useValue: {
            selectedPlan,
            plans,
            currentSubscription,
            isLoading: signal(false),
            error: signal(null),
            loadPlans: vi.fn(),
            loadCurrentPlan,
            selectPlan: vi.fn(),
          },
        },
        {
          provide: IamStore,
          useValue: {
            isSignedIn: signal(true),
            currentLaboratoryId: laboratoryId,
            onboarding: () => (status() ? { subscriptionStatus: status() } : null),
          },
        },
      ],
    });
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(PlanList);
    fixture.detectChanges();
    return fixture;
  }

  function cards(fixture: ReturnType<typeof create>) {
    return [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.plan-card'),
    ].map((card) => ({
      name: card.querySelector('h2')?.textContent?.trim(),
      badge: card.querySelector('.plan-badge')?.textContent?.trim() ?? null,
      action: card
        .querySelector('.select-btn, .plan-status, .billing-link, .plan-note')
        ?.textContent?.trim(),
      link: card.querySelector('a')?.getAttribute('href') ?? null,
    }));
  }

  beforeEach(() => {
    plans.set([plan]);
    selectedPlan.set(null);
    currentSubscription.set(null);
    status.set('INACTIVE');
    laboratoryId.set(null);
    loadCurrentPlan.mockReset();
  });

  it('goes straight to the checkout of a plan chosen before, while the account has no subscription', () => {
    selectedPlan.set(plan);
    create();
    expect(navigate).toHaveBeenCalledWith(['/subscriptions/checkout'], {
      queryParams: { plan: 'BASIC', billingCycle: 'YEARLY' },
    });
  });

  it('shows the plans when nothing was chosen', () => {
    create();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not open a checkout for an account that already has a subscription', () => {
    selectedPlan.set(plan);
    status.set('ACTIVE');
    create();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('sells every plan to an account without a subscription, and reads no subscription', () => {
    plans.set(catalog);
    laboratoryId.set(42);
    const fixture = create();

    expect(cards(fixture)).toEqual([
      { name: 'Standard Lab', badge: null, action: 'subscription.plans.get', link: null },
      {
        name: 'Enterprise',
        badge: 'star subscription.plans.recommended',
        action: 'subscription.plans.get',
        link: null,
      },
    ]);
    expect(loadCurrentPlan).not.toHaveBeenCalled();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.select-btn')!.click();
    expect(navigate).toHaveBeenCalledWith(['/subscriptions/checkout'], {
      queryParams: { plan: 'BASIC', billingCycle: 'MONTHLY' },
    });
  });

  it('marks the plan the laboratory pays for and sends the other plans to Billing', () => {
    plans.set(catalog);
    status.set('ACTIVE');
    laboratoryId.set(42);
    currentSubscription.set(paid());
    const fixture = create();
    const element = fixture.nativeElement as HTMLElement;

    expect(loadCurrentPlan).toHaveBeenCalledWith(42);
    expect(cards(fixture)).toEqual([
      {
        name: 'Standard Lab',
        badge: 'check_circle subscription.plans.current-plan',
        action: 'check_circle subscription.plans.current-renews',
        link: null,
      },
      {
        name: 'Enterprise',
        badge: 'star subscription.plans.recommended',
        action: 'subscription.plans.manage-in-billing arrow_forward',
        link: '/subscriptions/billing',
      },
    ]);
    expect(element.querySelector('.info-banner a')?.getAttribute('href')).toBe(
      '/subscriptions/billing',
    );
  });

  it('says until when the paid plan stays active once its renewal is cancelled', () => {
    plans.set(catalog);
    status.set('ACTIVE');
    laboratoryId.set(42);
    currentSubscription.set(paid({ cancelAtPeriodEnd: true }));
    const fixture = create();

    expect(cards(fixture)[0].action).toBe('check_circle subscription.plans.current-until');
  });

  it('opens on the billing period of the paid plan, and keeps the one the person picks', () => {
    plans.set(catalog);
    status.set('ACTIVE');
    laboratoryId.set(42);
    currentSubscription.set(paid({ planCode: 'ENTERPRISE', billingCycle: 'YEARLY' }));
    const fixture = create();
    const element = fixture.nativeElement as HTMLElement;

    expect(cards(fixture).map((card) => [card.name, card.badge])).toEqual([
      ['Standard Lab', null],
      ['Enterprise', 'check_circle subscription.plans.current-plan'],
    ]);

    element.querySelectorAll<HTMLElement>('.period-toggle button')[0].click();
    currentSubscription.set(paid({ planCode: 'ENTERPRISE', billingCycle: 'YEARLY', id: 10 }));
    fixture.detectChanges();

    expect(cards(fixture).map((card) => card.action)).toEqual([
      'subscription.plans.manage-in-billing arrow_forward',
      'subscription.plans.manage-in-billing arrow_forward',
    ]);
  });

  it('does not mark a subscription read for another laboratory', () => {
    plans.set(catalog);
    status.set('ACTIVE');
    laboratoryId.set(42);
    currentSubscription.set(paid({ laboratoryId: 7 }));
    const fixture = create();

    expect(cards(fixture).map((card) => card.action)).toEqual([
      'subscription.plans.manage-in-billing arrow_forward',
      'subscription.plans.manage-in-billing arrow_forward',
    ]);
  });

  it('says that no plan is available, with nothing to follow, while a paid account has no laboratory yet', () => {
    plans.set(catalog);
    status.set('ACTIVE');
    const fixture = create();

    expect(loadCurrentPlan).not.toHaveBeenCalled();
    expect(cards(fixture).map((card) => [card.action, card.link])).toEqual([
      ['subscription.plans.unavailable', null],
      ['subscription.plans.unavailable', null],
    ]);
    expect((fixture.nativeElement as HTMLElement).querySelector('a')).toBeNull();
  });
});
