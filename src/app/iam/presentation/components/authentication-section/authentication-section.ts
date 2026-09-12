import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Presentational component for rendering authentication navigation actions.
 *
 * @remarks
 * This standalone component belongs to the IAM presentation layer. It provides
 * entry points for users to access sign-in and sign-up flows without containing
 * authentication logic itself.
 *
 * It is intentionally stateless and delegates navigation to Angular Router
 * through template bindings.
 */
@Component({
  selector: 'app-authentication-section',
  standalone: true,
  imports: [RouterLink, TranslatePipe, MatButtonModule, MatIconModule],
  templateUrl: './authentication-section.html',
  styleUrl: './authentication-section.css',
})
export class AuthenticationSection {}
