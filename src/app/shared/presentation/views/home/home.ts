import { Component, inject, ChangeDetectionStrategy, Type } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { NgComponentOutlet } from '@angular/common';
import { ActivatedRoute } from '@angular/router';

/**
 * Public landing page.
 *
 * @remarks
 * This component lives in `shared`, so it cannot import the `AuthenticationSection`
 * from the `iam` context directly.
 *
 * To solve this, the `AuthenticationSection` is passed dynamically via the router's
 * `data` property (see `app.routes.ts`). We then render it using Angular's
 * `NgComponentOutlet`. This maintains the decoupling of the `shared` context.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [TranslatePipe, NgComponentOutlet],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './home.css',
})
export class Home {
  private route = inject(ActivatedRoute);

  /**
   * The authentication component injected dynamically from the router configuration.
   */
  readonly authComponent = this.route.snapshot.data['authComponent'] as Type<unknown>;
}
