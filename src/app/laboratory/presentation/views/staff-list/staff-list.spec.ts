import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { LaboratoryStore } from '../../../application/laboratory.store';
import { StaffMember } from '../../../domain/model/staff-member.entity';
import { StaffList } from './staff-list';

const member = (id: number, active: boolean) => new StaffMember({
  id, laboratoryId: 7, fullName: `Member ${id}`, role: 'Operator', email: `member${id}@example.test`, active, accessRole: 'OPERATOR', userId: id,
});

describe('StaffList', () => {
  const open = (canManage: boolean) => {
    TestBed.configureTestingModule({ imports: [StaffList], providers: [
      provideRouter([]), provideTranslateService(),
      { provide: IamStore, useValue: { canManageQuality: signal(canManage), isAuditor: signal(!canManage), requireLaboratoryId: () => 7 } },
      { provide: LaboratoryStore, useValue: {
        staffList: signal([member(1, true), member(2, false)]), isLoading: signal(false), loadStaff: vi.fn(), deactivateStaff: vi.fn(),
      } },
    ] });
    const fixture = TestBed.createComponent(StaffList);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  };

  it('offers the quality manager the deactivation of the active members', () => {
    const element = open(true);
    expect(element.querySelectorAll('thead th').length).toBe(6);
    expect(element.querySelectorAll('tbody tr:first-child td').length).toBe(6);
    expect(element.querySelectorAll('.danger-icon').length).toBe(1);
  });

  it('shows the other roles the members without any action', () => {
    const element = open(false);
    expect(element.querySelectorAll('thead th').length).toBe(5);
    expect(element.querySelectorAll('tbody tr:first-child td').length).toBe(5);
    expect(element.querySelector('.danger-icon')).toBeNull();
  });
});
