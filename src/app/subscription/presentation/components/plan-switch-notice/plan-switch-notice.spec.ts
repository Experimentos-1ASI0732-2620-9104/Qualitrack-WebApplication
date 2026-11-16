import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideTranslateService } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';
import { SubscriptionStore } from '../../../application/subscription.store';
import { PlanSwitchDialog } from '../plan-switch-dialog/plan-switch-dialog';
import { PlanSwitchNotice } from './plan-switch-notice';

describe('PlanSwitchNotice', () => {
  const catalog = [
    { code: 'BASIC', name: 'Standard Lab', billingPeriod: 'MONTHLY' },
    { code: 'ENTERPRISE', name: 'Enterprise', billingPeriod: 'YEARLY' },
  ];
  const planSwitch = {
    chosen: { planCode: 'ENTERPRISE', billingCycle: 'YEARLY' },
    current: { planCode: 'BASIC', billingCycle: 'MONTHLY', currentPeriodEnd: '2026-12-05T20:08:04Z' },
    plans: catalog,
  };
  const open = vi.fn();
  const findPlanSwitch = vi.fn();
  const canManageQuality = signal(true);
  const currentLaboratoryId = signal<number | null>(42);

  function create() {
    TestBed.configureTestingModule({
      imports: [PlanSwitchNotice],
      providers: [
        provideTranslateService(),
        { provide: MatDialog, useValue: { open } },
        { provide: SubscriptionStore, useValue: { findPlanSwitch } },
        { provide: IamStore, useValue: { canManageQuality, currentLaboratoryId } },
      ],
    });
    const fixture = TestBed.createComponent(PlanSwitchNotice);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    open.mockClear();
    findPlanSwitch.mockReset();
    findPlanSwitch.mockResolvedValue(planSwitch);
    canManageQuality.set(true);
    currentLaboratoryId.set(42);
  });

  it('tells how to switch, naming both plans and the end of the paid period', async () => {
    await create().whenStable();
    expect(findPlanSwitch).toHaveBeenCalledWith(42);
    expect(open).toHaveBeenCalledTimes(1);
    const [component, config] = open.mock.calls[0];
    expect(component).toBe(PlanSwitchDialog);
    expect(config.data.chosen).toMatch(/^Enterprise \(/);
    expect(config.data.current).toMatch(/^Standard Lab \(/);
    expect(config.data.periodEnd).toBe('2026-12-05T20:08:04Z');
  });

  it('names the plans with their codes when the catalog could not be read', async () => {
    findPlanSwitch.mockResolvedValue({ ...planSwitch, plans: [] });
    await create().whenStable();
    expect(open.mock.calls[0][1].data.chosen).toMatch(/^ENTERPRISE \(/);
    expect(open.mock.calls[0][1].data.current).toMatch(/^BASIC \(/);
  });

  it('stays quiet when there is nothing to say', async () => {
    findPlanSwitch.mockResolvedValue(null);
    await create().whenStable();
    expect(open).not.toHaveBeenCalled();
  });

  it.each([
    ['does not manage subscriptions', () => canManageQuality.set(false)],
    ['has no laboratory yet', () => currentLaboratoryId.set(null)],
  ])('does not look for a switch when the person %s', async (_case, arrange) => {
    arrange();
    await create().whenStable();
    expect(findPlanSwitch).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
  });

  it('does not open the notice over another page when the person left before the answer', async () => {
    let answer: (value: unknown) => void = () => undefined;
    findPlanSwitch.mockReturnValue(new Promise((resolve) => (answer = resolve)));
    const fixture = create();
    fixture.destroy();
    answer(planSwitch);
    await new Promise((resolve) => setTimeout(resolve));
    expect(open).not.toHaveBeenCalled();
  });
});
