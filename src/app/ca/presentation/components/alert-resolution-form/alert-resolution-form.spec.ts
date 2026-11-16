import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';

import { AlertResolutionForm } from './alert-resolution-form';

describe('AlertResolutionForm', () => {
  let fixture: ComponentFixture<AlertResolutionForm>;
  let element: HTMLElement;
  let resolved: string[];

  const textarea = () => element.querySelector('textarea')!;
  const write = (text: string) => {
    textarea().value = text;
    textarea().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };
  const submit = () => {
    element.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };
  const template = (index: number) => element.querySelectorAll<HTMLElement>('.template')[index];

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    TestBed.inject(TranslateService).setTranslation('en', {
      'ca-alerts': { detail: { templates: { filter: { text: 'The filter was replaced.' } } } },
    });
    TestBed.inject(TranslateService).use('en');
    fixture = TestBed.createComponent(AlertResolutionForm);
    resolved = [];
    fixture.componentInstance.resolve.subscribe((notes) => resolved.push(notes));
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
    document.body.appendChild(element);
  });

  afterEach(() => element.remove());

  it('does not accept notes shorter than 10 characters', () => {
    write('Too short');
    submit();
    expect(resolved).toEqual([]);
    expect(element.querySelector('mat-error')).not.toBeNull();
  });

  it('does not count surrounding spaces and sends the notes trimmed', () => {
    write('   short    ');
    submit();
    expect(resolved).toEqual([]);

    write('  The vent was adjusted  ');
    submit();
    expect(resolved).toEqual(['The vent was adjusted']);
  });

  it('does not accept notes longer than 500 characters', () => {
    write('x'.repeat(501));
    submit();
    expect(resolved).toEqual([]);
  });

  it('counts what is written', () => {
    write('Twelve chars');
    expect(element.textContent).toContain('12/500');
  });

  it('writes a template that can be edited and is already valid', () => {
    template(1).click();
    fixture.detectChanges();
    expect(textarea().value).toBe('The filter was replaced.');
    expect(document.activeElement).toBe(textarea());

    write('The filter was replaced twice.');
    submit();
    expect(resolved).toEqual(['The filter was replaced twice.']);
  });

  it('adds the template to what is written, without losing it', () => {
    write('Door closed.');
    template(1).click();
    expect(textarea().value).toBe('Door closed. The filter was replaced.');
  });

  it('empties the notes for another alert', () => {
    write('Door closed.');
    fixture.componentInstance.reset();
    fixture.detectChanges();
    expect(textarea().value).toBe('');
  });
});
