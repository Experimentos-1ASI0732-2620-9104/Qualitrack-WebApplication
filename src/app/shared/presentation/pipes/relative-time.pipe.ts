import { inject, Pipe, PipeTransform } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { formatRelativeTime } from '../utils/date-time-format';

/**
 * Shows how long ago an instant was, for example `hace 28 días`.
 *
 * @remarks
 * Impure so that it follows the language the person chooses, like the `translate` pipe. The view passes the current
 * time, so the text only ages when the view decides to refresh it.
 */
@Pipe({ name: 'relativeTime', standalone: true, pure: false })
export class RelativeTimePipe implements PipeTransform {
  private readonly translate = inject(TranslateService);

  /**
   * @param value - The instant to compare
   * @param now - The current instant, kept by the view
   * @returns How long ago it was, or an empty text when there is no instant
   */
  transform(value: string | Date | null | undefined, now: Date): string {
    return formatRelativeTime(value, this.translate.getCurrentLang() || 'en', now);
  }
}
