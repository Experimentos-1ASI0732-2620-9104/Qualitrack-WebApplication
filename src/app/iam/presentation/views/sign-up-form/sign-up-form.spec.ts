import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { IamStore } from '../../../application/iam.store';
import { SignUpForm } from './sign-up-form';

describe('SignUpForm', () => {
  const signUp = vi.fn();

  function create() {
    TestBed.configureTestingModule({
      imports: [SignUpForm],
      providers: [provideTranslateService(), provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    vi.spyOn(TestBed.inject(IamStore), 'signUp').mockImplementation(signUp as never);
    const fixture = TestBed.createComponent(SignUpForm);
    fixture.detectChanges();
    return fixture.componentInstance as unknown as {
      form: import('@angular/forms').FormGroup;
      onSubmit(): void;
      getUsernameErrorKey(): string;
    };
  }

  const valid = {
    username: ' maria.perez ',
    email: ' maria@lab.com.pe ',
    password: 'secret123',
    confirmPassword: 'secret123',
  };

  beforeEach(() => signUp.mockClear());

  it('accepts valid data', () => {
    const { form } = create();
    form.setValue(valid);
    expect(form.valid).toBe(true);
  });

  it.each([
    ['username', '   ', 'notBlank'],
    ['username', 'ab', 'minlength'],
    ['username', 'x'.repeat(81), 'maxlength'],
    ['email', 'maria@lab', 'email'],
    ['email', 'maria', 'email'],
    ['email', `${'x'.repeat(115)}@a.com`, 'maxlength'],
  ])('rejects %s = %j with %s', (field, value, error) => {
    const { form } = create();
    form.setValue({ ...valid, [field]: value });
    expect(form.get(field)?.hasError(error)).toBe(true);
  });

  it('accepts a username of exactly 80 characters', () => {
    const { form } = create();
    form.setValue({ ...valid, username: 'x'.repeat(80) });
    expect(form.get('username')?.valid).toBe(true);
  });

  it('shows the matching message for the username', () => {
    const component = create();
    component.form.get('username')?.setValue('   ');
    expect(component.getUsernameErrorKey()).toBe('iam.sign-up.errors.username-required');
    component.form.get('username')?.setValue('x'.repeat(81));
    expect(component.getUsernameErrorKey()).toBe('iam.sign-up.errors.username-maxlength');
  });

  it('sends the username and the e-mail without surrounding spaces', () => {
    const component = create();
    component.form.setValue(valid);
    component.onSubmit();
    expect(signUp).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'maria.perez', email: 'maria@lab.com.pe' }),
      expect.anything(),
    );
  });

  it('does not send an invalid form', () => {
    const component = create();
    component.form.setValue({ ...valid, email: 'maria@lab' });
    component.onSubmit();
    expect(signUp).not.toHaveBeenCalled();
  });
});
