import { Directive, ElementRef, HostListener, inject } from '@angular/core';

/**
 * Keeps only the digits of a text.
 *
 * @param value - The text typed or pasted by the user
 * @returns The text without any character that is not a digit
 */
export function sanitizeDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Restricts a text input to digits, both when typing and when pasting.
 *
 * @remarks
 * Meant for identifiers made only of digits, such as the RUC and the DNI. Letters, spaces and symbols are removed as
 * they arrive, so a pasted `20 1234 56789` becomes `20123456789`.
 */
@Directive({
  selector: 'input[digitsOnly]',
  standalone: true,
})
export class DigitsOnly {
  private readonly input = inject<ElementRef<HTMLInputElement>>(ElementRef).nativeElement;

  /**
   * Removes the characters that are not digits and notifies the form of the cleaned value.
   */
  @HostListener('input')
  protected onInput(): void {
    const cleaned = sanitizeDigits(this.input.value);
    if (cleaned === this.input.value) return;
    this.input.value = cleaned;
    this.input.dispatchEvent(new Event('input'));
  }
}
