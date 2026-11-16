import { EnvironmentPreference } from './environment-preference';

describe('EnvironmentPreference', () => {
  const environments = [
    { id: 1, usage: 'LABORATORY' },
    { id: 2, usage: 'RAW_MATERIAL_STORAGE' },
    { id: 3, usage: null },
  ];

  beforeEach(() => localStorage.clear());

  it('opens the remembered environment of its area and laboratory', () => {
    new EnvironmentPreference('tracking').remember(7, 3);

    expect(new EnvironmentPreference('tracking').choose(7, environments)?.id).toBe(3);
    expect(localStorage.getItem('qualitrack.environment.7.tracking')).toBe('3');
    expect(new EnvironmentPreference('inventory').read(7)).toBeNull();
    expect(new EnvironmentPreference('tracking').read(8)).toBeNull();
  });

  it('falls back to the preferred usage, then to the first environment', () => {
    const preference = new EnvironmentPreference('inventory');

    expect(preference.choose(7, environments, 'RAW_MATERIAL_STORAGE')?.id).toBe(2);
    expect(preference.choose(7, environments, 'PRODUCTION')?.id).toBe(1);
    expect(preference.choose(7, [])).toBeNull();
  });

  it('ignores a remembered environment the laboratory no longer has', () => {
    const preference = new EnvironmentPreference('production');
    preference.remember(7, 99);

    expect(preference.choose(7, environments)?.id).toBe(1);
  });
});
