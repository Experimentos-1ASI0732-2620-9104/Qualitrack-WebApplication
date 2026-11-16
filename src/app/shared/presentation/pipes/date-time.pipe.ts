import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { formatDateTime } from '../utils/date-time-format';

/**
 * Shows an instant in the single date format of the application, for example `3 oct 2026, 09:00`.
 *
 * @remarks
 * Impure so that it follows the language the person chooses, like the `translate` pipe.
 */
@Pipe({ name: 'dateTime', standalone: true, pure: false })
export class DateTimePipe implements PipeTransform {
  private readonly translate = inject(TranslateService);

  /**
   * @param value - The instant to show
   * @returns The formatted instant, or an empty text when there is none
   */
  transform(value: string | Date | null | undefined): string {
    return formatDateTime(value, this.translate.getCurrentLang() || 'en');
  }
}
