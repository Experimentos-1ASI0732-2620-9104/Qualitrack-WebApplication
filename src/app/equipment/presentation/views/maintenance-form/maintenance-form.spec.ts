import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { MaintenanceForm } from './maintenance-form';

describe('MaintenanceForm', () => {
  function create() {
    TestBed.configureTestingModule({
      imports: [MaintenanceForm],
      providers: [
        provideTranslateService(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: IamStore, useValue: { requireLaboratoryId: () => 1, canManageQuality: () => true } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '4' } } } },
      ],
    });
    const fixture = TestBed.createComponent(MaintenanceForm);
    fixture.detectChanges();
    return fixture.componentInstance as unknown as {
      form: import('@angular/forms').FormGroup;
      today: Date;
      minDate: Date;
    };
  }

  const valid = { maintenanceDate: new Date(2026, 8, 1), technicianStaffId: 3, type: 'PREVENTIVE', description: 'Cambio de filtros' };

  it('starts today and limits the date between 2020 and today', () => {
    const { form, today, minDate } = create();
    expect(form.get('maintenanceDate')?.value).toEqual(today);
    expect(minDate).toEqual(new Date(2020, 0, 1));
  });

  it('accepts valid data', () => {
    const { form } = create();
    form.setValue(valid);
    expect(form.valid).toBe(true);
  });

  it('rejects a description made only of spaces', () => {
    const { form } = create();
    form.setValue({ ...valid, description: '   ' });
    expect(form.get('description')?.hasError('notBlank')).toBe(true);
  });
});
