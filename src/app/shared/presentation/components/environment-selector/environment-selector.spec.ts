import { TestBed } from '@angular/core/testing';
import { MatSelect } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { provideTranslateService } from '@ngx-translate/core';
import { EnvironmentSelector } from './environment-selector';

describe('EnvironmentSelector', () => {
  const environments = [
    { id: 1, code: 'ALM-MP-01', name: 'Raw materials storage' },
    { id: 2, code: 'PROD-SOL-01', name: 'Solids production' },
  ];

  function create(inputs: Record<string, unknown> = {}) {
    TestBed.configureTestingModule({ imports: [EnvironmentSelector], providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(EnvironmentSelector);
    fixture.componentRef.setInput('environments', environments);
    Object.entries(inputs).forEach(([name, value]) => fixture.componentRef.setInput(name, value));
    fixture.detectChanges();
    const select = fixture.debugElement.query(By.directive(MatSelect)).componentInstance as MatSelect;
    return { fixture, select };
  }

  it('does not offer the option for every environment unless the view asks for it', () => {
    const { select } = create();

    expect(select.options.length).toBe(2);
    expect(select.value).toBeNull();
  });

  it('shows the option for every environment as selected while there is no environment', () => {
    const { select } = create({ allOptionKey: 'environments.all' });

    expect(select.options.length).toBe(3);
    expect(select.value).toBe('all');
  });

  it('emits the selected environment or the option for every environment', () => {
    const { fixture, select } = create({ allOptionKey: 'environments.all' });
    const selected: number[] = [];
    let allSelections = 0;
    fixture.componentInstance.selectedChange.subscribe((environmentId) => selected.push(environmentId));
    fixture.componentInstance.allSelected.subscribe(() => allSelections++);

    select.options.get(2)!.select();
    select.options.get(0)!.select();

    expect(selected).toEqual([2]);
    expect(allSelections).toBe(1);
  });

  it('is a form field unless the view asks for the line under its title', () => {
    const { fixture } = create();
    const host: HTMLElement = fixture.nativeElement;

    expect(host.querySelector('mat-form-field')).not.toBeNull();
    expect(host.querySelector('.environment-inline')).toBeNull();
  });

  it('shows the chosen environment as a line, with its whole code and name as tooltip', async () => {
    const { fixture } = create({ appearance: 'inline', selectedId: 2 });
    await fixture.whenStable();
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    const inline = host.querySelector('.environment-inline')!;

    expect(host.querySelector('mat-form-field')).toBeNull();
    expect(inline.querySelector('.code')?.textContent?.trim()).toBe('PROD-SOL-01');
    expect(inline.querySelector('.name')?.textContent?.trim()).toBe('· Solids production');
    expect(inline.getAttribute('title')).toBe('PROD-SOL-01 · Solids production');
    expect(inline.getAttribute('aria-label')).toBe('environments.selector');
  });

  it('shows the option for every environment in the line while there is no environment', async () => {
    const { fixture } = create({ appearance: 'inline', allOptionKey: 'environments.all' });
    await fixture.whenStable();
    fixture.detectChanges();
    const inline: HTMLElement = fixture.nativeElement.querySelector('.environment-inline');

    expect(inline.querySelector('.code')?.textContent?.trim()).toBe('environments.all');
    expect(inline.querySelector('.name')).toBeNull();
    expect(inline.hasAttribute('title')).toBe(false);
  });

  it('lists each environment with its code, usage and name in the line appearance', () => {
    const { select } = create({
      appearance: 'inline',
      environments: [
        { id: 3, code: 'ALM-01', name: 'Finished goods storage', usage: 'PRODUCT_STORAGE' },
      ],
    });
    const option = select.options.get(0)!._getHostElement();

    expect(option.querySelector('.option-code')?.textContent?.trim()).toBe('ALM-01');
    expect(option.querySelector('.option-usage')?.textContent?.trim()).toBe(
      'environment-usage.PRODUCT_STORAGE',
    );
    expect(option.querySelector('.option-name')?.textContent?.trim()).toBe(
      'Finished goods storage',
    );
  });
});
