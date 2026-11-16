import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { IamStore } from '../../../application/iam.store';
import { UserSessionSection } from './user-session-section';

/** Session controls work without providing or loading any Profile dependency. */
describe('UserSessionSection', () => {
  const signedIn = signal(true);
  const signOut = vi.fn();

  beforeEach(() => {
    signedIn.set(true);
    signOut.mockClear();
    TestBed.configureTestingModule({
      imports: [UserSessionSection],
      providers: [provideRouter([]), provideTranslateService(),
        { provide: IamStore, useValue: { isSignedIn: signedIn, signOut } }],
    });
  });

  it('delegates sign-out to IAM with the router', () => {
    const fixture = TestBed.createComponent(UserSessionSection);
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector('button')?.click();
    expect(signOut).toHaveBeenCalledWith(TestBed.inject(Router));
  });

  it('hides sign-out without a signed-in session', () => {
    signedIn.set(false);
    const fixture = TestBed.createComponent(UserSessionSection);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('button')).toBeNull();
  });
});
