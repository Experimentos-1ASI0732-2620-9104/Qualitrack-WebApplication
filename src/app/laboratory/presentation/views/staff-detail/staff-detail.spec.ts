import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { IamStore } from '../../../../iam/application/iam.store';
import { LaboratoryStore } from '../../../application/laboratory.store';
import { StaffMember } from '../../../domain/model/staff-member.entity';
import { StaffDetail } from './staff-detail';

describe('StaffDetail navigation', () => {
  it.each([
    { manager: true, userId: 9, showProfile: true },
    { manager: false, userId: 9, showProfile: false },
    { manager: true, userId: null, showProfile: false },
  ])('shows the profile link only for a manager and a staff account: %j', ({ manager, userId, showProfile }) => {
    const member = new StaffMember({ id: 2, laboratoryId: 7, fullName: 'Ana', role: 'Operator', email: 'ana@example.test', active: true, accessRole: 'OPERATOR', userId });
    TestBed.configureTestingModule({ imports: [StaffDetail], providers: [
      provideRouter([]), provideTranslateService(),
      { provide: ActivatedRoute, useValue: { paramMap: of(convertToParamMap({ staffId: '2' })) } },
      { provide: IamStore, useValue: { canManageQuality: () => manager, requireLaboratoryId: () => 7 } },
      { provide: LaboratoryStore, useValue: { staffMember: () => of(member) } },
    ] });
    const fixture = TestBed.createComponent(StaffDetail); fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(!!element.querySelector('a[href="/profile/staff/2"]')).toBe(showProfile);
    expect(element.querySelector('a[href="/reports/staff/2/activity"]')).not.toBeNull();
    expect(!!element.querySelector('button')).toBe(manager);
  });
});
