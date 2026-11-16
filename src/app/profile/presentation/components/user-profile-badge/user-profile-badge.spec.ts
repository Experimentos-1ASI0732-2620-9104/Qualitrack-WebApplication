import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { ProfileStore } from '../../../application/profile.store';
import { UserProfileBadge } from './user-profile-badge';

/** The toolbar must keep the same identity and navigation when its ownership moves to Profile. */
describe('UserProfileBadge', () => {
  const signedIn = signal(true);
  const onboarding = signal<{ nextStep: string } | null>(null);
  const roles = signal<string[]>(['ROLE_QA_MANAGER']);
  const photoUrl = signal<string | null>(null);
  const ensureLoaded = vi.fn();

  beforeEach(() => {
    signedIn.set(true);
    onboarding.set(null);
    roles.set(['ROLE_QA_MANAGER']);
    photoUrl.set(null);
    ensureLoaded.mockClear();
    TestBed.configureTestingModule({
      imports: [UserProfileBadge],
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: IamStore, useValue: { isSignedIn: signedIn, onboarding, currentRoles: roles } },
        { provide: ProfileStore, useValue: {
          photoUrl, displayName: signal('María Pérez'), initials: signal('MP'), ensureLoaded,
        } },
      ],
    });
    const translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', { profile: { roles: { ROLE_QA_MANAGER: 'Quality manager' },
      open: 'My profile', 'open-named': 'Open the profile of {{name}}' } });
    translate.use('en');
  });

  function create() {
    const fixture = TestBed.createComponent(UserProfileBadge);
    fixture.detectChanges();
    return fixture;
  }

  it('shows the initials and full name when the profile has no photo', () => {
    const element = create().nativeElement as HTMLElement;
    expect(element.querySelector('.user-avatar')?.textContent?.trim()).toBe('MP');
    expect(element.querySelector('.user-name')?.textContent).toBe('María Pérez');
    expect(element.querySelector('img')).toBeNull();
  });

  it('shows the photo instead of the initials when one is available', () => {
    photoUrl.set('blob:profile-photo');
    const element = create().nativeElement as HTMLElement;
    expect(element.querySelector('img')?.getAttribute('src')).toBe('blob:profile-photo');
    expect(element.querySelector('.user-avatar')?.textContent?.trim()).toBe('');
  });

  it.each([null, { nextStep: 'SUBSCRIPTION' }, { nextStep: 'LABORATORY' }])(
    'does not open or load the profile before onboarding is ready: %j', (state) => {
      onboarding.set(state);
      const element = create().nativeElement as HTMLElement;
      expect(element.querySelector('a')).toBeNull();
      expect(ensureLoaded).not.toHaveBeenCalled();
    },
  );

  it('opens and loads the profile when onboarding becomes ready', () => {
    const fixture = create();
    onboarding.set({ nextStep: 'READY' });
    fixture.detectChanges();
    const link = (fixture.nativeElement as HTMLElement).querySelector('a');
    expect(link?.getAttribute('href')).toBe('/profile');
    expect(link?.getAttribute('aria-label')).toBe('Open the profile of María Pérez');
    expect(ensureLoaded).toHaveBeenCalledOnce();
  });

  it('translates the session role and removes its label when no role is available', () => {
    const fixture = create();
    expect(fixture.nativeElement.querySelector('.user-role')?.textContent).toBe('Quality manager');
    roles.set([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.user-role')).toBeNull();
  });

  it('does not display the profile without a signed-in session', () => {
    signedIn.set(false);
    expect((create().nativeElement as HTMLElement).querySelector('.user-identity')).toBeNull();
  });
});
