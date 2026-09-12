import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { CaStore } from './ca.store';
import { CaApi } from '../infrastructure/ca-api';
import { DeviationAlert } from '../domain/model/deviation-alert.entity';

describe('CaStore filtered alerts', () => {
  it('ignores an old response after selection changes or filters are cleared', () => {
    const first = new Subject<DeviationAlert[]>();
    const second = new Subject<DeviationAlert[]>();
    TestBed.configureTestingModule({ providers: [{ provide: CaApi, useValue: {
      getAlerts: (filters: { equipmentId: number }) => filters.equipmentId === 23 ? first : second,
    } }] });
    const store = TestBed.inject(CaStore);
    store.loadAlerts({ equipmentId: 23 });
    first.next([{ equipmentId: 23 } as DeviationAlert]);
    store.loadAlerts({ equipmentId: 24 });
    expect(store.alerts()).toEqual([]);
    first.next([{ equipmentId: 23 } as DeviationAlert]);
    expect(store.alerts()).toEqual([]);
    second.next([{ equipmentId: 24 } as DeviationAlert]);
    expect(store.alerts()[0].equipmentId).toBe(24);
    store.clearAlerts();
    second.next([{ equipmentId: 24 } as DeviationAlert]);
    expect(store.alerts()).toEqual([]);
  });
});
