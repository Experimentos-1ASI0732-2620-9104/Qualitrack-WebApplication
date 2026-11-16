import { TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { Router, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Layout } from './layout';

describe('Layout', () => {
  function brandLink(signedIn: boolean): string | null {
    TestBed.configureTestingModule({
      imports: [Layout],
      providers: [provideTranslateService(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(Layout);
    fixture.componentRef.setInput('isSignedIn', signedIn);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).querySelector('a.brand')?.getAttribute('href') ?? null;
  }

  it('leads the logo to the home page before signing in', () => {
    expect(brandLink(false)).toBe('/home');
  });

  it('leads the logo to the dashboard once signed in', () => {
    expect(brandLink(true)).toBe('/dashboard');
  });

  describe('side menu', () => {
    @Component({ template: '' })
    class Page {}

    async function activeOptionsAt(url: string) {
      TestBed.configureTestingModule({
        imports: [Layout],
        providers: [provideTranslateService(), provideRouter([{ path: '**', component: Page }])],
      });
      await TestBed.inject(Router).navigateByUrl(url);
      const fixture = TestBed.createComponent(Layout);
      fixture.componentRef.setInput('hasOperationalAccess', true);
      fixture.detectChanges();
      await fixture.whenStable();
      const element = fixture.nativeElement as HTMLElement;
      return {
        expanded: element.querySelectorAll('mat-expansion-panel.mat-expanded').length,
        active: [...element.querySelectorAll('.sub-nav-item.sub-active')].map((item) => item.textContent!.trim()),
      };
    }

    it.each([
      ['/alerts', 'nav.alert-dashboard'],
      ['/alerts?environmentId=1', 'nav.alert-dashboard'],
      ['/alerts/history?environmentId=1', 'nav.alert-history'],
      ['/reports/deviation-trends?days=7&env=1', 'nav.deviation-trends'],
      ['/tracking/history#readings', 'nav.tracking-history'],
    ])('keeps the option of %s active', async (url, option) => {
      expect(await activeOptionsAt(url)).toEqual({ expanded: 1, active: [option] });
    });
  });
});
