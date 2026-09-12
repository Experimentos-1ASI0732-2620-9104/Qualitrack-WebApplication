import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { RaStore } from './ra.store';
import { RaApi } from '../infrastructure/ra-api';
import { DeviationTrend } from '../domain/model/deviation-trend.entity';

describe('RaStore equipment selection', () => {
  it('cancels old trends and clears existing data before loading another equipment', () => {
    const first = new Subject<DeviationTrend[]>();
    const second = new Subject<DeviationTrend[]>();
    TestBed.configureTestingModule({ providers: [{ provide: RaApi, useValue: {
      getTrendsByEquipment: (id: number) => id === 23 ? first : second,
    } }] });
    const store = TestBed.inject(RaStore);
    store.loadDeviationTrends(23);
    first.next([{ equipmentId: 23 } as DeviationTrend]);
    store.loadDeviationTrends(24);
    expect(store.deviationTrends()).toEqual([]);
    first.next([{ equipmentId: 23 } as DeviationTrend]);
    expect(store.deviationTrends()).toEqual([]);
    second.next([{ equipmentId: 24 } as DeviationTrend]);
    expect(store.deviationTrends()[0].equipmentId).toBe(24);
    expect(store.isLoading()).toBe(false);
  });
});
