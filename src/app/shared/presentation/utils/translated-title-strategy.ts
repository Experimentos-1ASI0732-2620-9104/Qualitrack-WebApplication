import { inject, Injectable } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

/** Name of the application, at the end of the title of every page. */
const APPLICATION_NAME = 'QualiTrack';

/**
 * Title of the browser tab, in the language of the application.
 *
 * @remarks
 * The `title` of a route is a translation key, and the tab follows the language when the user changes it. A route
 * without a title shows only the name of the application, so the tab never keeps the title of the previous page.
 */
@Injectable()
export class TranslatedTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly translate = inject(TranslateService);

  /** Translation of the current page, replaced on each navigation. */
  private translation: Subscription | null = null;

  /**
   * Shows the title of the page the router has just opened.
   *
   * @param snapshot - State of the router after the navigation
   */
  override updateTitle(snapshot: RouterStateSnapshot): void {
    const key = this.buildTitle(snapshot);
    this.translation?.unsubscribe();
    this.translation = null;
    if (key === undefined) {
      this.title.setTitle(APPLICATION_NAME);
      return;
    }
    this.translation = this.translate.stream(key).subscribe((text) => {
      this.title.setTitle(`${String(text)} - ${APPLICATION_NAME}`);
    });
  }
}
