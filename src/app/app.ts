import { Component, inject, signal } from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, TranslateModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App {
  protected readonly title = signal('QualiTrack | IoTech');
  private translate = inject(TranslateService);

  constructor() {
    this.translate.addLangs(['en_US', 'es_419']);
    this.translate.use('en_US');
    document.documentElement.lang = 'en-US';
  }
}
