import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { formatDate } from '../utils/date-time-format';

/**
 * Shows a day in the single date format of the application, for example `3 oct 2026`.
 *
 * @remarks
 * Impure so that it follows the language the person chooses, like the `translate` pipe.
 */
@Pipe({ name: 'dateOnly', standalone: true, pure: false })
export class DateOnlyPipe implements PipeTransform {
  private readonly translate = inject(TranslateService);

  /**
   * @param value - The instant or the `yyyy-MM-dd` calendar day to show
   * @returns The formatted day, or an empty text when there is none
   */
  transform(value: string | Date | null | undefined): string {
    return formatDate(value, this.translate.getCurrentLang() || 'en');
  }
}
