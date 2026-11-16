import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { SIGNED_IN } from '../../tokens/signed-in.token';
import { PageNotFound } from './page-not-found';

describe('PageNotFound', () => {
  function mainAction(signedIn?: boolean): string | null {
    TestBed.configureTestingModule({
      imports: [PageNotFound],
      providers: [
        provideTranslateService(),
        provideRouter([]),
        ...(signedIn === undefined ? [] : [{ provide: SIGNED_IN, useValue: signal(signedIn) }]),
      ],
    });
    const fixture = TestBed.createComponent(PageNotFound);
    fixture.detectChanges();
    return (fixture.nativeElement as HTMLElement).querySelector('.primary-action')?.getAttribute('href') ?? null;
  }

  it('sends a signed-in user to the dashboard', () => {
    expect(mainAction(true)).toBe('/dashboard');
  });

  it('sends a visitor to the home page', () => {
    expect(mainAction(false)).toBe('/home');
  });

  it('treats the session as closed when the composition root provides none', () => {
    expect(mainAction()).toBe('/home');
  });
});
