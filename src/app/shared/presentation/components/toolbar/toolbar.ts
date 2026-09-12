import { Component } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { LanguageSwitcher } from '../language-switcher/language-switcher';

/**
 * @summary Barra de navegación superior (Toolbar) para QualiTrack.
 * @remarks Componente presentacional que envuelve el logo de la marca,
 * el título y el selector de idiomas. Se utiliza principalmente en
 * vistas públicas (como el Home) donde no se requiere el Sidenav.
 * @author QualiTrack
 */
@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [MatToolbarModule, LanguageSwitcher],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.css',
})
export class Toolbar {}
