import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

import { IamStore } from '../../../../iam/application/iam.store';
import { InventoryStore } from '../../../application/inventory.store';
import { InventoryHome } from './inventory-home';

describe('InventoryHome', () => {
  let finishLoading: () => void = () => undefined;
  const preferredEnvironment = signal<{ id: number } | null>({ id: 7 });

  function create() {
    TestBed.configureTestingModule({
      imports: [InventoryHome],
      providers: [
        provideTranslateService(),
        provideRouter([]),
        { provide: IamStore, useValue: { canManageQuality: signal(false) } },
        {
          provide: InventoryStore,
          useValue: {
            loadEnvironments: () => new Promise<void>((resolve) => (finishLoading = resolve)),
            preferredEnvironment,
            environmentsLoading: signal(true),
            environmentsError: signal(null),
            environmentsEmpty: signal(false),
          },
        },
      ],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(InventoryHome);
    fixture.detectChanges();
    return { fixture, navigate };
  }

  const loaded = async () => {
    finishLoading();
    await new Promise((resolve) => setTimeout(resolve));
  };

  beforeEach(() => preferredEnvironment.set({ id: 7 }));

  it('opens the raw materials of the preferred environment once the environments load', async () => {
    const { navigate } = create();
    expect(navigate).not.toHaveBeenCalled();
    await loaded();
    expect(navigate).toHaveBeenCalledWith(['/inventory/environments', 7, 'raw-materials'], { replaceUrl: true });
  });

  it('stays on the page when the laboratory has no environment', async () => {
    preferredEnvironment.set(null);
    const { navigate } = create();
    await loaded();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does not bring back someone who left while the environments were loading', async () => {
    const { fixture, navigate } = create();
    fixture.destroy();
    await loaded();
    expect(navigate).not.toHaveBeenCalled();
  });
});
