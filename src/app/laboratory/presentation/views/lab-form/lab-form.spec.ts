import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { LaboratoryStore } from '../../../application/laboratory.store';
import { LabForm } from './lab-form';

describe('LabForm', () => {
  const createLaboratory = vi.fn();
  let element: HTMLElement;

  function create() {
    TestBed.configureTestingModule({
      imports: [LabForm],
      providers: [provideTranslateService(), provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    TestBed.overrideComponent(LabForm, {
      set: { providers: [{ provide: LaboratoryStore, useValue: { isLoading: () => false, error: () => null, createLaboratory } }] },
    });
    const fixture = TestBed.createComponent(LabForm);
    fixture.detectChanges();
    element = fixture.nativeElement;
    const component = fixture.componentInstance as unknown as {
      form: import('@angular/forms').FormGroup;
      onSubmit(): void;
    };
    return component;
  }

  const valid = {
    name: ' PharmaCorp ',
    ruc: '20123456789',
    address: ' Av. Tecnológica 123, Lima ',
    phone: '987 654 320',
    applicableRegulations: ['BPM_DIGEMID'],
  };

  beforeEach(() => createLaboratory.mockClear());

  it('accepts valid data', () => {
    const { form } = create();
    form.setValue(valid);
    expect(form.valid).toBe(true);
  });

  it.each([
    ['name', '   ', 'notBlank'],
    ['name', 'x'.repeat(101), 'maxlength'],
    ['ruc', '10123456789', 'ruc'],
    ['ruc', '2012345678', 'ruc'],
    ['address', '   ', 'notBlank'],
    ['address', 'x'.repeat(251), 'maxlength'],
    ['phone', 'abc', 'phoneChars'],
    ['phone', '999999999', 'phoneFake'],
    ['phone', '12345', 'phone'],
  ])('rejects %s = %j with %s', (field, value, error) => {
    const { form } = create();
    form.setValue({ ...valid, [field]: value });
    expect(form.get(field)?.hasError(error)).toBe(true);
  });

  it('sends trimmed text and the normalized phone', () => {
    const component = create();
    component.form.setValue(valid);
    component.onSubmit();
    expect(createLaboratory).toHaveBeenCalledWith(
      {
        name: 'PharmaCorp',
        ruc: '20123456789',
        address: 'Av. Tecnológica 123, Lima',
        phone: '+51987654320',
        applicableRegulations: ['BPM_DIGEMID'],
      },
      expect.any(Function),
    );
  });

  it('removes anything but digits from the RUC while typing', () => {
    const { form } = create();
    const input = element.querySelector<HTMLInputElement>('input[formControlName="ruc"]')!;
    input.value = '20 12a3-4';
    input.dispatchEvent(new Event('input'));
    expect(input.value).toBe('201234');
    expect(form.get('ruc')?.value).toBe('201234');
  });

  it('does not send an invalid form', () => {
    const component = create();
    component.form.setValue({ ...valid, ruc: '10123456789' });
    component.onSubmit();
    expect(createLaboratory).not.toHaveBeenCalled();
  });
});
