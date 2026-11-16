import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { FilterChip } from './filter-chip';

describe('FilterChip', () => {
  function render(inputs: Record<string, unknown>) {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(FilterChip);
    fixture.componentRef.setInput('labelKey', 'chip.label');
    for (const [name, value] of Object.entries(inputs)) fixture.componentRef.setInput(name, value);
    fixture.detectChanges();
    return fixture;
  }

  it('tells whether it is pressed and how many results it leaves', () => {
    const button = render({ pressed: true, count: 4 }).nativeElement.querySelector('button');

    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(button.querySelector('.count').textContent).toBe('4');
  });

  it('shows no count when it has none', () => {
    const button = render({}).nativeElement.querySelector('button');

    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(button.querySelector('.count')).toBeNull();
  });

  it('emits when it is pressed', () => {
    const fixture = render({});
    const toggled = vi.fn();
    fixture.componentInstance.toggled.subscribe(toggled);

    fixture.nativeElement.querySelector('button').click();

    expect(toggled).toHaveBeenCalledTimes(1);
  });
});
