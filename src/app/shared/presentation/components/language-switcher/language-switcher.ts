import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { map } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';

const NARROW_SCREEN = '(max-width: 480px)';

/**
 * @summary Selector de idioma global de QualiTrack.
 * @remarks Permite al usuario cambiar entre español e inglés. Utiliza
 * ngx-translate para aplicar el cambio de idioma de forma reactiva en
 * toda la aplicación. Se ubica en el toolbar del Layout principal.
 * @author Ruiz Madrid, Billy Jake
 */
@Component({
  selector: 'app-language-switcher',
  imports: [MatButtonToggleGroup, MatButtonToggle, TranslatePipe],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.css',
})
export class LanguageSwitcher {
  protected currentLang = 'en';
  protected languages = [
    { code: 'en', label: 'EN', name: 'English' },
    { code: 'es', label: 'ES', name: 'Español' },
  ];
  protected translate: TranslateService;
  private readonly breakpoints = inject(BreakpointObserver);

  /**
   * On narrow screens the check mark of the selected language is hidden so the toolbar keeps room for the user;
   * the selected language is still shown by its highlighted button.
   */
  protected readonly compact = toSignal(this.breakpoints.observe(NARROW_SCREEN).pipe(map((state) => state.matches)),
    { initialValue: this.breakpoints.isMatched(NARROW_SCREEN) });

  constructor() {
    this.translate = inject(TranslateService);
    this.currentLang = this.translate.getCurrentLang();
  }

  useLanguage(language: string): void {
    this.translate.use(language);
    this.currentLang = language;
    document.documentElement.lang = language;
  }
}
