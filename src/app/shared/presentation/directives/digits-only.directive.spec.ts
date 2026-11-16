import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DigitsOnly, sanitizeDigits } from './digits-only.directive';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, DigitsOnly],
  template: `<input digitsOnly [formControl]="control" />`,
})
class Host {
  readonly control = new FormControl('');
}

describe('sanitizeDigits', () => {
  it('keeps only the digits', () => {
    expect(sanitizeDigits('20a1b2-3 4+5')).toBe('2012345');
    expect(sanitizeDigits('abc')).toBe('');
    expect(sanitizeDigits('')).toBe('');
  });
});

describe('DigitsOnly', () => {
  function typeInto(text: string) {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = text;
    input.dispatchEvent(new Event('input'));
    return { input, control: fixture.componentInstance.control };
  }

  it('removes letters, spaces and symbols from what is typed', () => {
    const { input, control } = typeInto('20a1b2');
    expect(input.value).toBe('2012');
    expect(control.value).toBe('2012');
  });

  it('cleans a pasted value with separators', () => {
    const { control } = typeInto('20 1234-56789');
    expect(control.value).toBe('20123456789');
  });

  it('leaves a clean value untouched', () => {
    const { control } = typeInto('72345678');
    expect(control.value).toBe('72345678');
  });
});
