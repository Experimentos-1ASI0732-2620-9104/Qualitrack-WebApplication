import {
  ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, TitleStrategy } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { routes } from './app.routes';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { authenticationInterceptor } from './iam/infrastructure/iam-interceptor';
import { IamStore } from './iam/application/iam.store';
import { SIGNED_IN } from './shared/presentation/tokens/signed-in.token';
import { TranslatedTitleStrategy } from './shared/presentation/utils/translated-title-strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    { provide: TitleStrategy, useClass: TranslatedTitleStrategy },
    provideHttpClient(withFetch(), withInterceptors([authenticationInterceptor])),
    provideTranslateService({
      loader: provideTranslateHttpLoader({ prefix: './i18n/', suffix: '.json' }),
      fallbackLang: 'en',
    }),
    provideCharts(withDefaultRegisterables()),
    // The shared views read the session through this token, so shared never imports IAM.
    { provide: SIGNED_IN, useFactory: () => inject(IamStore).isSignedIn },
  ],
};
