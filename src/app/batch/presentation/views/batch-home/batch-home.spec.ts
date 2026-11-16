import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

import { BatchStore } from '../../../application/batch.store';
import { BatchHome } from './batch-home';

describe('BatchHome', () => {
  let finishLoading: () => void = () => undefined;

  function create() {
    TestBed.configureTestingModule({
      imports: [BatchHome],
      providers: [
        provideTranslateService(),
        provideRouter([]),
        {
          provide: BatchStore,
          useValue: {
            loadEnvironments: () => new Promise<void>((resolve) => (finishLoading = resolve)),
            preferredProductionEnvironment: signal({ id: 7 }),
            environmentsLoading: signal(true),
            environmentsError: signal(null),
            environmentsEmpty: signal(false),
            canManageProducts: signal(false),
          },
        },
      ],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(BatchHome);
    fixture.detectChanges();
    return { fixture, navigate };
  }

  const loaded = async () => {
    finishLoading();
    await new Promise((resolve) => setTimeout(resolve));
  };

  it('opens the products of the preferred environment once the environments load', async () => {
    const { navigate } = create();
    await loaded();
    expect(navigate).toHaveBeenCalledWith(['/batches/environments', 7, 'products'], { replaceUrl: true });
  });

  it('does not bring back someone who left while the environments were loading', async () => {
    const { fixture, navigate } = create();
    fixture.destroy();
    await loaded();
    expect(navigate).not.toHaveBeenCalled();
  });
});
