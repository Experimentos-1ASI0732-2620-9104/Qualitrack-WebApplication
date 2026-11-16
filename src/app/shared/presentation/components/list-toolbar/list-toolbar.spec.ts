import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ListToolbar } from './list-toolbar';

@Component({
  imports: [ListToolbar],
  template: `
    <app-list-toolbar
      [searchKey]="searchKey()"
      [search]="search()"
      [activeFilters]="activeFilters()"
      (searchChange)="search.set($event)"
    >
      <span toolbarContext class="context-item">Environment</span>
      <button toolbarActions class="create" type="button">Create</button>
      <button toolbarFilters class="chip" type="button">Chip</button>
      <span toolbarSort class="sort">Sort</span>
      <p toolbarMore class="note">Note</p>
    </app-list-toolbar>
  `,
})
class HostList {
  readonly searchKey = signal<string | null>('list.search');
  readonly search = signal('');
  readonly activeFilters = signal(0);
}

describe('ListToolbar', () => {
  function create() {
    TestBed.configureTestingModule({ imports: [HostList], providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(HostList);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const input = () => element.querySelector<HTMLInputElement>('.search input');
    const toggle = () => element.querySelector<HTMLButtonElement>('.toggle')!;
    const filters = () => element.querySelector<HTMLElement>('.row.filters')!;
    return { fixture, host: fixture.componentInstance, element, input, toggle, filters };
  }

  it('puts the context and the buttons to create in the first row, the rest in the second', () => {
    const { element } = create();

    expect(element.querySelector('.row.primary .context .context-item')).not.toBeNull();
    expect(element.querySelector('.row.primary .actions .create')).not.toBeNull();
    expect(element.querySelector('.row.filters .chips .chip')).not.toBeNull();
    expect(element.querySelector('.row.filters .find .sort')).not.toBeNull();
    expect(element.querySelector('.row.filters .more .note')).not.toBeNull();
  });

  it('searches as the person writes', () => {
    const { fixture, host, input } = create();

    input()!.value = 'amox';
    input()!.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(host.search()).toBe('amox');
  });

  it('offers an × to clear the search only while there is something written', () => {
    const { fixture, host, element } = create();
    expect(element.querySelector('.clear')).toBeNull();

    host.search.set('amox');
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('.clear')!.click();
    fixture.detectChanges();

    expect(host.search()).toBe('');
    expect(element.querySelector('.clear')).toBeNull();
  });

  it('clears the search with Escape', () => {
    const { fixture, host, input } = create();
    host.search.set('amox');
    fixture.detectChanges();

    input()!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(host.search()).toBe('');
  });

  it('has no search when the list does not offer one', () => {
    const { fixture, host, input } = create();

    host.searchKey.set(null);
    fixture.detectChanges();

    expect(input()).toBeNull();
  });

  it('folds the filters with its arrow, and tells how many are in use while folded', () => {
    const { fixture, host, toggle, filters } = create();
    host.activeFilters.set(2);
    fixture.detectChanges();
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(toggle().querySelector('.count')).toBeNull();

    toggle().click();
    fixture.detectChanges();

    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(filters().hidden).toBe(true);
    expect(toggle().querySelector('.count')?.textContent).toBe('2');
    expect(toggle().getAttribute('aria-controls')).toBe(filters().id);
  });
});
