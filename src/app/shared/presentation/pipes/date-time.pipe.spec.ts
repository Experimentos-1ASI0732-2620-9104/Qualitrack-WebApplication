import { TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { DateTimePipe } from './date-time.pipe';
import { RelativeTimePipe } from './relative-time.pipe';

describe('date pipes', () => {
  const instant = '2026-10-04T14:00:00Z';
  const now = new Date('2026-11-01T14:00:00Z');

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService(), DateTimePipe, RelativeTimePipe],
    });
  });

  it('follow the language the person chooses', async () => {
    const translate = TestBed.inject(TranslateService);
    const dateTime = TestBed.runInInjectionContext(() => new DateTimePipe());
    const relativeTime = TestBed.runInInjectionContext(() => new RelativeTimePipe());

    translate.use('es');
    expect(dateTime.transform(instant)).toBe('4 oct 2026, 09:00');
    expect(relativeTime.transform(instant, now)).toBe('hace 28 días');

    translate.use('en');
    expect(dateTime.transform(instant)).toBe('Oct 4, 2026, 09:00');
    expect(relativeTime.transform(instant, now)).toBe('28 days ago');
  });
});
