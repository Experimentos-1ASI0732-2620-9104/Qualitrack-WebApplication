import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { BehaviorSubject, of, Subject, throwError } from 'rxjs';
import { IamStore } from '../../../../iam/application/iam.store';
import { ProfileStore, StaffProfile } from '../../../application/profile.store';
import { Profile } from '../../../domain/model/profile.entity';
import { StaffProfilePage } from './staff-profile';

describe('StaffProfilePage', () => {
  const params = new BehaviorSubject(convertToParamMap({ staffId: '2' }));
  const staffProfile = vi.fn();
  const profile = new Profile({ userId: 4, staffId: 2, username: 'ana', email: null, roles: [], fullName: 'Ana Pérez', dni: null, phoneNumber: null, location: null, position: null, hasPhoto: true, photoUpdatedAt: null, updatedAt: null });
  beforeEach(() => {
    params.next(convertToParamMap({ staffId: '2' }));
    staffProfile.mockReset().mockReturnValue(of({ profile, photoUrl: 'blob:staff-2' }));
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    TestBed.configureTestingModule({ imports: [StaffProfilePage], providers: [
      provideRouter([]), provideTranslateService(),
      { provide: ActivatedRoute, useValue: { paramMap: params } },
      { provide: IamStore, useValue: { requireLaboratoryId: () => 7 } },
      { provide: ProfileStore, useValue: { staffProfile } },
    ] });
  });
  afterEach(() => vi.restoreAllMocks());
  it('releases photo URLs on route changes and destruction', () => {
    const fixture = TestBed.createComponent(StaffProfilePage); fixture.detectChanges();
    expect(staffProfile).toHaveBeenCalledWith(7, 2);
    staffProfile.mockReturnValue(of({ profile, photoUrl: 'blob:staff-3' }));
    params.next(convertToParamMap({ staffId: '3' }));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:staff-2');
    fixture.destroy();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:staff-3');
  });
  it('does not replace the current profile with a late response for another staff member', () => {
    const stale = new Subject<StaffProfile>();
    staffProfile.mockReturnValueOnce(stale);
    const fixture = TestBed.createComponent(StaffProfilePage); fixture.detectChanges();
    params.next(convertToParamMap({ staffId: '3' }));
    stale.next({ profile, photoUrl: 'blob:stale' });
    expect(fixture.componentInstance['profile']()?.photoUrl).toBe('blob:staff-2');
  });
  it('shows an unavailable state when the profile cannot be read', () => {
    staffProfile.mockReturnValue(throwError(() => new Error('unavailable')));
    const fixture = TestBed.createComponent(StaffProfilePage); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('staff.profile.unavailable');
    expect(fixture.componentInstance['loading']()).toBe(false);
  });
});
