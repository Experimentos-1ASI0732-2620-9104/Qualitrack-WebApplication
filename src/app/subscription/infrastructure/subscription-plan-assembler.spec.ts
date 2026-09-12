import { SubscriptionPlanAssembler } from './subscription-plan-assembler';
import { SubscriptionPlanResource } from './subscription-plan-response';

describe('SubscriptionPlanAssembler equipment allowances', () => {
  const assembler = new SubscriptionPlanAssembler();
  const resource: SubscriptionPlanResource = {
    id: 1, code: 'ENTERPRISE', name: 'Enterprise', description: 'Test fixture',
    amount: 599, currency: 'USD', billingCycle: 'MONTHLY', stripePriceId: 'price_fixture',
    maxUsers: 10, maxEquipment: null, active: true,
  };

  it('preserves an unlimited allowance and never displays null as a quantity', () => {
    const plan = assembler.toEntityFromResource(resource);
    expect(plan.maxEquipment).toBeNull();
    expect(plan.features).toContain('Unlimited equipment connections');
    expect(plan.features.join(' ')).not.toContain('null');
    expect(assembler.toResourceFromEntity(plan).maxEquipment).toBeNull();
  });

  it('preserves finite allowances from the backend', () => {
    const plan = assembler.toEntityFromResource({ ...resource, maxEquipment: 5 });
    expect(plan.maxEquipment).toBe(5);
    expect(plan.maxUsers).toBe(10);
    expect(assembler.toResourceFromEntity(plan).maxEquipment).toBe(5);
  });
});
