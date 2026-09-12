import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Component displayed when the user cancels or leaves the payment flow.
 *
 * @remarks
 * This view allows users to retry checkout or return to the plan selection
 * screen without losing the subscription flow context.
 */
@Component({
  selector: 'app-payment-cancel',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './payment-cancel.html',
  styleUrl: './payment-cancel.css',
})
export class PaymentCancel {}
