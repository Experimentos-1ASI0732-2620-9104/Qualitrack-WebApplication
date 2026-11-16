import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { formatElapsedTime } from '../utils/date-time-format';

/**
 * Shows how long passed between two instants, for example `14 min`.
 *
 * @remarks
 * Impure so that it follows the language the person chooses, like the `translate` pipe.
 */
@Pipe({ name: 'elapsedTime', standalone: true, pure: false })
export class ElapsedTimePipe implements PipeTransform {
  private readonly translate = inject(TranslateService);

  /**
   * @param value - The first instant
   * @param until - The later instant
   * @returns How long passed between them, or an empty text when an instant is missing
   */
  transform(
    value: string | Date | null | undefined,
    until: string | Date | null | undefined,
  ): string {
    return formatElapsedTime(value, until, this.translate.getCurrentLang() || 'en');
  }
}
