import { AbstractControl } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';

/**
 * Marks a field as wrong when it is invalid, or when its form has the given error, once it was touched.
 *
 * @remarks
 * A rule that compares two fields (a password and its confirmation) is an error of the form, not of
 * the field, so a Material field would not show it by itself.
 *
 * @param groupError - Name of the error of the form that also belongs to this field.
 */
export function groupErrorMatcher(groupError: string): ErrorStateMatcher {
  return {
    isErrorState: (control: AbstractControl | null) =>
      !!control && control.touched && (control.invalid || !!control.parent?.hasError(groupError)),
  };
}
