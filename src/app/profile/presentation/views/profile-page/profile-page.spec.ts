import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { ProfileStore } from '../../../application/profile.store';
import { ProfilePage } from './profile-page';

describe('ProfilePage', () => {
  const update = vi.fn(() => of({}));

  function create(fragment: string | null = null) {
    TestBed.configureTestingModule({
      imports: [ProfilePage],
      providers: [
        provideTranslateService(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { fragment: of(fragment) } },
      ],
    });
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    vi.spyOn(TestBed.inject(ProfileStore), 'update').mockImplementation(update as never);
    const fixture = TestBed.createComponent(ProfilePage);
    fixture.detectChanges();
    return fixture.componentInstance as unknown as {
      personalForm: import('@angular/forms').FormGroup;
      accountForm: import('@angular/forms').FormGroup;
      savePersonalData(): void;
    };
  }

  const personal = { fullName: 'María Ñahui-Pérez', dni: '72345678', phoneNumber: '987 654 320', location: 'Miraflores, Lima' };

  beforeEach(() => update.mockClear());

  it('redirects the legacy notification fragment before profile data finishes loading', () => {
    create('notifications');
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/alerts/notification-settings'], { replaceUrl: true });
  });

  it('accepts valid personal data, with the DNI and the phone optional', () => {
    const { personalForm } = create();
    personalForm.setValue(personal);
    expect(personalForm.valid).toBe(true);
    personalForm.setValue({ ...personal, dni: '', phoneNumber: '', location: '' });
    expect(personalForm.valid).toBe(true);
  });

  it.each([
    ['fullName', '   ', 'notBlank'],
    ['fullName', 'Juan3', 'personName'],
    ['fullName', 'J', 'minlength'],
    ['dni', '1234567', 'dni'],
    ['dni', '1234567a', 'dni'],
    ['dni', '11111111', 'dniFake'],
    ['phoneNumber', 'abc', 'phoneChars'],
    ['phoneNumber', '999999999', 'phoneFake'],
    ['phoneNumber', '123456', 'phone'],
    ['location', '   ', 'notBlank'],
  ])('rejects personal %s = %j with %s', (field, value, error) => {
    const { personalForm } = create();
    personalForm.setValue({ ...personal, [field]: value });
    expect(personalForm.get(field)?.hasError(error)).toBe(true);
  });

  it('sends the phone number in international form', () => {
    const component = create();
    component.personalForm.setValue(personal);
    component.savePersonalData();
    expect(update).toHaveBeenCalledWith({ ...personal, phoneNumber: '+51987654320' });
  });

  it('does not send invalid personal data', () => {
    const component = create();
    component.personalForm.setValue({ ...personal, dni: '11111111' });
    component.savePersonalData();
    expect(update).not.toHaveBeenCalled();
  });

  it('validates the account username and e-mail', () => {
    const { accountForm } = create();
    const account = { username: 'maria.perez', email: 'maria@lab.com.pe', currentPassword: 'secret123' };
    accountForm.setValue(account);
    expect(accountForm.valid).toBe(true);
    accountForm.setValue({ ...account, username: 'x'.repeat(81) });
    expect(accountForm.get('username')?.hasError('maxlength')).toBe(true);
    accountForm.setValue({ ...account, username: '   ' });
    expect(accountForm.get('username')?.hasError('notBlank')).toBe(true);
    accountForm.setValue({ ...account, email: 'maria@lab' });
    expect(accountForm.get('email')?.hasError('email')).toBe(true);
  });
});
