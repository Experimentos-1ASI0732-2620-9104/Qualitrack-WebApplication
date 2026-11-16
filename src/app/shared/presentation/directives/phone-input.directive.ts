import { Directive, ElementRef, HostListener, inject } from '@angular/core';
import { sanitizePhoneInput } from '../validators/phone.validator';

/**
 * Restricts a text input to the characters of a phone number, both when typing and when pasting.
 *
 * @remarks
 * Letters and symbols are removed as they arrive; a + is accepted only as the first character.
 */
@Directive({
  selector: 'input[phoneInput]',
  standalone: true,
})
export class PhoneInput {
  private readonly input = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;

  /**
   * Removes the characters that are not allowed and notifies the form of the cleaned value.
   */
  @HostListener('input')
  protected onInput(): void {
    const cleaned = sanitizePhoneInput(this.input.value);
    if (cleaned === this.input.value) return;
    this.input.value = cleaned;
    this.input.dispatchEvent(new Event('input'));
  }
}
