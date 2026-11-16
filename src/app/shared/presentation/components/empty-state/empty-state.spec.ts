import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { EmptyState } from './empty-state';

@Component({
  imports: [EmptyState],
  template: `
    <app-empty-state titleKey="empty.title" messageKey="empty.message" [positive]="true">
      <a href="/history">History</a>
    </app-empty-state>
  `,
})
class HostPage {}

describe('EmptyState', () => {
  function create<T>(component: new () => T) {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(component);
    return fixture;
  }

  it('only shows the message when that is all it receives', () => {
    const fixture = create(EmptyState);
    fixture.componentRef.setInput('messageKey', 'empty.message');
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('p')?.textContent).toBe('empty.message');
    expect(element.querySelector('h2')).toBeNull();
    expect(element.querySelector('.positive')).toBeNull();
  });

  it('can tell good news and offer what to do next', () => {
    const fixture = create(HostPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h2')?.textContent).toBe('empty.title');
    expect(element.querySelector('.positive')).not.toBeNull();
    expect(element.querySelector('.actions a')?.textContent).toBe('History');
  });
});
