import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { LaboratoryStore } from '../../../application/laboratory.store';
import { Environment } from '../../../domain/model/environment.entity';
import { EnvironmentList } from './environment-list';

const environment = new Environment({
  id: 3, laboratoryId: 1, code: 'ALM-01', name: 'Raw material warehouse', description: null,
  usage: 'RAW_MATERIAL_STORAGE', usageAssignedBy: 7, usageAssignedAt: '2026-05-10T14:00:00Z',
});

describe('EnvironmentList', () => {
  const open = (canManage: boolean, environments: Environment[]) => {
    TestBed.configureTestingModule({ imports: [EnvironmentList], providers: [
      provideRouter([]), provideTranslateService(),
      { provide: LaboratoryStore, useValue: {
        environments: signal(environments), environmentsLoading: signal(false), environmentError: signal(null),
        canManageEnvironments: signal(canManage), loadEnvironments: vi.fn(), clearEnvironmentError: vi.fn(),
      } },
    ] });
    const fixture = TestBed.createComponent(EnvironmentList);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('offers the quality manager the edition and the usage of each environment', () => {
    const element = open(true, [environment]);
    expect(element.querySelectorAll('thead th').length).toBe(5);
    expect(element.querySelectorAll('.row-actions button').length).toBe(2);
  });

  it('lets the other roles only consult the environments', () => {
    const element = open(false, [environment]);
    expect(element.querySelectorAll('thead th').length).toBe(4);
    expect(element.querySelectorAll('tbody td').length).toBe(4);
    expect(element.querySelector('.row-actions')).toBeNull();
  });

  it.each([
    { canManage: true, columns: '5' },
    { canManage: false, columns: '4' },
  ])('spreads the empty message over the visible columns: %j', ({ canManage, columns }) => {
    const element = open(canManage, []);
    expect(element.querySelector('tbody td')?.getAttribute('colspan')).toBe(columns);
  });
});
