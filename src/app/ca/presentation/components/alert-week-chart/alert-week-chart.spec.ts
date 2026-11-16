import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

import { AlertWeek } from '../../../domain/model/alert-history-weeks';
import { AlertWeekChart } from './alert-week-chart';

describe('AlertWeekChart', () => {
  const weeks: AlertWeek[] = [
    { start: '2026-09-14', bySeverity: { CRITICAL: 1, WARNING: 2, LOW: 0 } },
    { start: '2026-09-21', bySeverity: { CRITICAL: 0, WARNING: 1, LOW: 3 } },
  ];

  function render() {
    TestBed.configureTestingModule({
      providers: [provideTranslateService(), provideCharts(withDefaultRegisterables())],
    });
    const fixture = TestBed.createComponent(AlertWeekChart);
    fixture.componentRef.setInput('weeks', weeks);
    fixture.detectChanges();
    return fixture;
  }

  it('stacks one bar per week by severity, from zero', () => {
    const chart = render().componentInstance as unknown as {
      data(): { labels: string[]; datasets: { data: number[] }[] };
      options: { scales: { y: { stacked: boolean; beginAtZero: boolean } } };
    };

    expect(chart.data().labels).toEqual(['Sep 14, 2026', 'Sep 21, 2026']);
    expect(chart.data().datasets.map((dataset) => dataset.data)).toEqual([
      [1, 0],
      [2, 1],
      [0, 3],
    ]);
    expect(chart.options.scales.y).toMatchObject({ stacked: true, beginAtZero: true });
  });

  it('tells the same numbers in a table for screen readers', () => {
    const rows = [...(render().nativeElement as HTMLElement).querySelectorAll('tbody tr')].map(
      (row) => [...row.children].map((cell) => cell.textContent!.trim()).join(' '),
    );

    expect(rows).toEqual(['Sep 14, 2026 1 2 0', 'Sep 21, 2026 0 1 3']);
  });
});
