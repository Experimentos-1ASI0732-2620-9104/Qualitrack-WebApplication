import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { provideTranslateService } from '@ngx-translate/core';
import { RawMaterialForm } from './raw-material-form';

describe('RawMaterialForm', () => {
  const open = (saving = false) => {
    TestBed.configureTestingModule({ imports: [RawMaterialForm], providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(RawMaterialForm);
    fixture.componentRef.setInput('form', new FormGroup({
      code: new FormControl('RM-001', { nonNullable: true }),
      name: new FormControl('Lactosa', { nonNullable: true }),
      minimumStock: new FormControl(20, { nonNullable: true }),
    }));
    fixture.componentRef.setInput('unit', 'kg');
    fixture.componentRef.setInput('saving', saving);
    fixture.detectChanges();
    return fixture;
  };

  it('shows the values of the form and the unit of the stock', () => {
    const element = open().nativeElement as HTMLElement;
    expect((element.querySelector('[formcontrolname="code"]') as HTMLInputElement).value).toBe('RM-001');
    expect(element.querySelector('[matTextSuffix]')?.textContent).toBe('kg');
  });

  it('tells when the user saves or cancels', () => {
    const fixture = open();
    const events: string[] = [];
    fixture.componentInstance.saveRequested.subscribe(() => events.push('save'));
    fixture.componentInstance.cancelRequested.subscribe(() => events.push('cancel'));
    const element = fixture.nativeElement as HTMLElement;
    (element.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    (element.querySelector('button[type="button"]') as HTMLButtonElement).click();
    expect(events).toEqual(['save', 'cancel']);
  });

  it('blocks both actions while saving', () => {
    const element = open(true).nativeElement as HTMLElement;
    expect([...element.querySelectorAll('button')].every((button) => button.disabled)).toBe(true);
  });
});
