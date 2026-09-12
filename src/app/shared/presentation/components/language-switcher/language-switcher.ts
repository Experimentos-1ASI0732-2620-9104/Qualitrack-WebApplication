import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';

/**
 * @summary Selector de idioma global de QualiTrack.
 * @remarks Permite al usuario cambiar entre español e inglés. Utiliza
 * ngx-translate para aplicar el cambio de idioma de forma reactiva en
 * toda la aplicación. Se ubica en el toolbar del Layout principal.
 * @author Ruiz Madrid, Billy Jake
 */
@Component({
  selector: 'app-language-switcher',
  imports: [MatButtonToggleGroup, MatButtonToggle],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.css',
})
export class LanguageSwitcher {
  protected currentLang = 'en_US';
  protected languages = [
    { code: 'en_US', label: 'EN', name: 'English' },
    { code: 'es_419', label: 'ES', name: 'Español' },
  ];
  protected translate: TranslateService;

  constructor() {
    this.translate = inject(TranslateService);
    this.currentLang = this.translate.getCurrentLang();
  }

  useLanguage(language: string): void {
    this.translate.use(language);
    this.currentLang = language;
    document.documentElement.lang = language.replace('_', '-');
  }
}
