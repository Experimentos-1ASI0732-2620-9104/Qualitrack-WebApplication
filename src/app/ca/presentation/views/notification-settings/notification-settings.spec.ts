import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { CaStore } from '../../../application/ca.store';
import { NotificationPreference } from '../../../domain/model/notification-preference.entity';
import { NotificationPreferencesForm } from '../../components/notification-preferences-form/notification-preferences-form';
import { NotificationSettings } from './notification-settings';

describe('NotificationSettings', () => {
  const preference = signal<NotificationPreference | null>(null);
  const loadNotificationPreferences = vi.fn();
  const updateNotificationPreferences = vi.fn(() => of({}));
  beforeEach(() => {
    preference.set(null); loadNotificationPreferences.mockClear(); updateNotificationPreferences.mockClear();
    TestBed.configureTestingModule({ imports: [NotificationSettings], providers: [
      provideRouter([]), provideTranslateService(),
      { provide: CaStore, useValue: { preference, loadNotificationPreferences, updateNotificationPreferences } },
    ] });
  });
  it('loads and displays the saved channels and severity in the standalone page', () => {
    const fixture = TestBed.createComponent(NotificationSettings); fixture.detectChanges();
    expect(loadNotificationPreferences).toHaveBeenCalledOnce();
    preference.set(new NotificationPreference({ id: 1, userId: 4, inAppEnabled: false, emailEnabled: true, minimumSeverity: 'CRITICAL' }));
    fixture.detectChanges();
    const component = fixture.debugElement.query(By.directive(NotificationPreferencesForm)).componentInstance as NotificationPreferencesForm;
    expect(component['form'].getRawValue()).toEqual({ inAppEnabled: false, emailEnabled: true, minimumSeverity: 'CRITICAL' });
    expect((fixture.nativeElement.querySelector('button[type="submit"]') as HTMLButtonElement).disabled).toBe(true);
    expect(updateNotificationPreferences).not.toHaveBeenCalled();
  });
  it('delegates an edited preference to CA and marks it saved without real API writes', () => {
    const fixture = TestBed.createComponent(NotificationSettings); fixture.detectChanges();
    const component = fixture.debugElement.query(By.directive(NotificationPreferencesForm)).componentInstance as NotificationPreferencesForm;
    component['form'].setValue({ inAppEnabled: true, emailEnabled: false, minimumSeverity: 'WARNING' });
    component['form'].markAsDirty();
    component['save']();
    expect(updateNotificationPreferences).toHaveBeenCalledWith({ inAppEnabled: true, emailEnabled: false, minimumSeverity: 'WARNING' });
    expect(component['saved']()).toBe(true);
    expect(component['form'].pristine).toBe(true);
  });
});
