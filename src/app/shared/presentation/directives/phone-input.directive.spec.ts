import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { PhoneInput } from './phone-input.directive';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, PhoneInput],
  template: `<input phoneInput [formControl]="control" />`,
})
class Host {
  readonly control = new FormControl('');
}

describe('PhoneInput', () => {
  function typeInto(text: string) {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = text;
    input.dispatchEvent(new Event('input'));
    return { input, control: fixture.componentInstance.control };
  }

  it('removes letters and symbols from what is typed or pasted', () => {
    const { input, control } = typeInto('98a7#65-4 3(2)');
    expect(input.value).toBe('98765-4 3(2)');
    expect(control.value).toBe('98765-4 3(2)');
  });

  it('keeps a + only at the start', () => {
    const { control } = typeInto('+51+987');
    expect(control.value).toBe('+51987');
  });

  it('leaves a clean value untouched', () => {
    const { control } = typeInto('+51 987 654 320');
    expect(control.value).toBe('+51 987 654 320');
  });
});
