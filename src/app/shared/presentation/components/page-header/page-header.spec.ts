import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { PageHeader, PageTab } from './page-header';

@Component({
  imports: [PageHeader],
  template: `
    <app-page-header
      icon="factory"
      titleKey="page.title"
      [tabs]="tabs()"
      [activeTab]="activeTab()"
      [loading]="loading()"
      [refreshable]="refreshable()"
      (refresh)="refreshed = refreshed + 1"
      (tabChosen)="chosen = $event"
    >
      <section class="page-content">Content</section>
    </app-page-header>
  `,
})
class HostPage {
  readonly tabs = signal<PageTab[]>([]);
  readonly activeTab = signal<string | null>(null);
  readonly loading = signal(false);
  readonly refreshable = signal(true);
  refreshed = 0;
  chosen: string | null = null;
}

describe('PageHeader', () => {
  function create() {
    TestBed.configureTestingModule({
      imports: [HostPage],
      providers: [provideRouter([]), provideTranslateService()],
    });
    const fixture = TestBed.createComponent(HostPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const tabs = () => Array.from(element.querySelectorAll<HTMLAnchorElement>('[mat-tab-link]'));
    return { fixture, host: fixture.componentInstance, element, tabs };
  }

  it('shows the title with its icon, and the content of the page after it', () => {
    const { element } = create();

    expect(element.querySelector('h1')?.textContent).toContain('page.title');
    expect(element.querySelector('h1 mat-icon')?.textContent).toBe('factory');
    expect(element.querySelector('.page-content')).not.toBeNull();
  });

  it('offers to refresh and says when the data was read, nothing else next to the title', () => {
    const { fixture, host, element } = create();

    element.querySelector<HTMLButtonElement>('.refresh')!.click();

    expect(host.refreshed).toBe(1);
    expect(element.querySelector('.updated')?.textContent).toContain('common.updated');
    expect(element.querySelectorAll('.status > *')).toHaveLength(2);

  });

  it('waits while the data is being read', () => {
    const { fixture, host, element } = create();

    host.loading.set(true);
    fixture.detectChanges();

    expect(element.querySelector<HTMLButtonElement>('.refresh')!.disabled).toBe(true);
  });

  it('shows neither the time nor the button on a page with nothing to refresh', () => {
    const { fixture, host, element } = create();

    host.refreshable.set(false);
    fixture.detectChanges();

    expect(element.querySelector('.refresh')).toBeNull();
    expect(element.querySelector('.updated')).toBeNull();
  });

  it('shows no tabs on a page that is the only operation of its module', () => {
    expect(create().tabs()).toHaveLength(0);
  });

  it('links the operations of the module and marks the one of the page, with their parameters', () => {
    const { fixture, host, tabs } = create();

    host.tabs.set([
      { labelKey: 'tabs.one', link: '/one', queryParams: { environmentId: 5 } },
      { labelKey: 'tabs.two', link: '/two' },
    ]);
    host.activeTab.set('/two');
    fixture.detectChanges();

    expect(tabs().map((tab) => tab.getAttribute('href'))).toEqual(['/one?environmentId=5', '/two']);
    expect(tabs()[1].classList).toContain('mdc-tab--active');
    expect(tabs()[0].classList).not.toContain('mdc-tab--active');
  });

  it('chooses a tab of the page itself without leaving it', () => {
    const { fixture, host, tabs } = create();
    host.tabs.set([
      { labelKey: 'tabs.catalogue', id: 'catalogue' },
      { labelKey: 'tabs.expiry', id: 'expiry' },
    ]);
    host.activeTab.set('catalogue');
    fixture.detectChanges();

    tabs()[1].click();

    expect(host.chosen).toBe('expiry');
  });
});
