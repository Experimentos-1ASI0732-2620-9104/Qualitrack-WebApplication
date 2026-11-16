import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  MatCalendarHarness,
  MatDateRangeInputHarness,
  MatDatepickerToggleHarness,
} from '@angular/material/datepicker/testing';
import { TranslateService, provideTranslateService } from '@ngx-translate/core';
import { localIsoDate } from '../../../../shared/presentation/utils/local-date';
import { BatchFilter, EMPTY_BATCH_FILTER } from '../../batch-filter';
import { BatchFilters } from './batch-filters';

describe('BatchFilters', () => {
  function create(filter: BatchFilter = { ...EMPTY_BATCH_FILTER }, lang = 'en') {
    TestBed.configureTestingModule({
      imports: [BatchFilters],
      providers: [provideTranslateService()],
    });
    TestBed.inject(TranslateService).use(lang);
    const fixture = TestBed.createComponent(BatchFilters);
    fixture.componentRef.setInput('filter', filter);
    const emitted: BatchFilter[] = [];
    // Like the list: every emitted criteria comes back as the new input
    fixture.componentInstance.filterChange.subscribe((value) => {
      emitted.push(value);
      fixture.componentRef.setInput('filter', value);
    });
    fixture.detectChanges();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const documentLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
    return {
      fixture,
      element: fixture.nativeElement as HTMLElement,
      emitted,
      loader,
      documentLoader,
    };
  }

  it('offers the period of the batches; the toolbar of the list holds the text and the environment', () => {
    const { element } = create();

    expect(element.querySelector('input[type=search]')).toBeNull();
    expect(element.querySelectorAll('mat-select').length).toBe(0);
    expect(element.querySelector('mat-date-range-input')).not.toBeNull();
    expect(element.querySelector('input[type=date]')).toBeNull();
    expect(element.querySelector('button.clear')).toBeNull();
  });

  it('emits both ends of the period picked in the calendar', async () => {
    const { emitted, loader, documentLoader } = create({ ...EMPTY_BATCH_FILTER, search: 'lot' });
    await (await loader.getHarness(MatDatepickerToggleHarness)).openCalendar();
    const calendar = await documentLoader.getHarness(MatCalendarHarness);

    await calendar.selectCell({ text: '5' });
    await calendar.selectCell({ text: '12' });

    const today = new Date();
    const day = (date: number) =>
      localIsoDate(new Date(today.getFullYear(), today.getMonth(), date));
    expect(emitted.at(-1)).toEqual({
      ...EMPTY_BATCH_FILTER,
      search: 'lot',
      from: day(5),
      to: day(12),
    });
    expect(emitted.some((filter) => filter.from === day(5) && filter.to === null)).toBe(true);
  });

  it('shows the period in the format of the language and offers to clear it', async () => {
    const { element, loader } = create(
      { ...EMPTY_BATCH_FILTER, from: '2026-10-01', to: '2026-10-15' },
      'es',
    );
    const range = await loader.getHarness(MatDateRangeInputHarness);

    expect(await (await range.getStartInput()).getValue()).toBe('1/10/2026');
    expect(await (await range.getEndInput()).getValue()).toBe('15/10/2026');
    expect(element.querySelector('button.clear')).not.toBeNull();
  });

  it.each(['mat-label', 'input[matEndDate]'])(
    'opens the calendar when the empty period is clicked on its %s',
    async (target) => {
      const { element, fixture, documentLoader } = create();

      element
        .querySelector<HTMLElement>(`.period ${target}`)!
        .dispatchEvent(new MouseEvent('click', { bubbles: true }));
      fixture.detectChanges();

      expect(await documentLoader.getAllHarnesses(MatCalendarHarness)).toHaveLength(1);
    },
  );
});
