import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';

import { BatchStore } from '../../../application/batch.store';
import { BatchRedirect } from './batch-redirect';

describe('BatchRedirect', () => {
  const link = ['/batches/environments', 7, 'products', 3, 'batches', 5];
  let answer: (batch: unknown) => void = () => undefined;
  const findBatch = vi.fn(() => new Promise((resolve) => (answer = resolve)));

  function create() {
    TestBed.configureTestingModule({
      imports: [BatchRedirect],
      providers: [
        provideTranslateService(),
        provideRouter([]),
        { provide: BatchStore, useValue: { findBatch } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ batchId: '5' }) } } },
      ],
    });
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(BatchRedirect);
    fixture.detectChanges();
    return { fixture, navigate };
  }

  const found = async (batch: unknown) => {
    answer(batch);
    await new Promise((resolve) => setTimeout(resolve));
  };

  it('opens the detail of the batch once it is found', async () => {
    const { navigate } = create();
    await found({ detailLink: link });
    expect(findBatch).toHaveBeenCalledWith(5);
    expect(navigate).toHaveBeenCalledWith(link, { replaceUrl: true });
  });

  it('does not bring back someone who left while the batch was being found', async () => {
    const { fixture, navigate } = create();
    fixture.destroy();
    await found({ detailLink: link });
    expect(navigate).not.toHaveBeenCalled();
  });
});
