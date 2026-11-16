import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router, TitleStrategy } from '@angular/router';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import { TranslatedTitleStrategy } from './translated-title-strategy';

@Component({ template: '' })
class EmptyPage {}

describe('TranslatedTitleStrategy', () => {
  let router: Router;
  let title: Title;
  let translate: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'equipment', component: EmptyPage, title: 'titles.equipment' },
          { path: 'staff', component: EmptyPage, title: 'titles.staff' },
          { path: 'untitled', component: EmptyPage },
          {
            path: 'alerts',
            component: EmptyPage,
            title: 'titles.alerts',
            children: [
              { path: 'open', component: EmptyPage },
              { path: 'detail', component: EmptyPage, title: 'titles.detail' },
            ],
          },
        ]),
        provideTranslateService(),
        { provide: TitleStrategy, useClass: TranslatedTitleStrategy },
      ],
    });
    router = TestBed.inject(Router);
    title = TestBed.inject(Title);
    translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', { titles: { equipment: 'Equipment', staff: 'Staff', alerts: 'Alerts', detail: 'Alert detail' } });
    translate.setTranslation('es', { titles: { equipment: 'Equipos', staff: 'Personal', alerts: 'Alertas', detail: 'Detalle de la alerta' } });
    translate.use('en');
    title.setTitle('Initial');
  });

  it('shows the translated title of the page with the name of the application', async () => {
    await router.navigateByUrl('/equipment');
    expect(title.getTitle()).toBe('Equipment - QualiTrack');
  });

  it('follows the language while the page stays open', async () => {
    await router.navigateByUrl('/equipment');
    translate.use('es');
    expect(title.getTitle()).toBe('Equipos - QualiTrack');
  });

  it('does not keep the title of the previous page on a page without one', async () => {
    await router.navigateByUrl('/equipment');
    await router.navigateByUrl('/untitled');
    expect(title.getTitle()).toBe('QualiTrack');
  });

  it('stops following the previous page after a navigation', async () => {
    await router.navigateByUrl('/equipment');
    await router.navigateByUrl('/staff');
    translate.use('es');
    expect(title.getTitle()).toBe('Personal - QualiTrack');
  });

  it('uses the title of the parent unless the child has its own', async () => {
    await router.navigateByUrl('/alerts/open');
    expect(title.getTitle()).toBe('Alerts - QualiTrack');
    await router.navigateByUrl('/alerts/detail');
    expect(title.getTitle()).toBe('Alert detail - QualiTrack');
  });
});
