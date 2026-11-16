import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';

import { EdgeGatewayApiKey } from '../../../domain/model/edge-gateway-api-key';

/** Value of the dialog that was last copied to the clipboard. */
type CopiedField = 'sensorExternalId' | 'apiKey';

/**
 * Dialog that shows the API key just issued for an Edge Gateway.
 *
 * @remarks
 * The cloud returns the key only once. The key lives only in this dialog while it is open: it is
 * never written to a store or to the browser storage, so closing the dialog discards it.
 */
@Component({
  selector: 'app-edge-gateway-api-key-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    MatIconModule,
    MatTooltipModule,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './edge-gateway-api-key-dialog.css',
  template: `
    <h2 mat-dialog-title>{{ 'edge-gateway.api-key.dialog.title' | translate }}</h2>
    <mat-dialog-content>
      <p class="once" role="alert">
        <mat-icon aria-hidden="true">warning</mat-icon>
        <span>{{ 'edge-gateway.api-key.dialog.once' | translate }}</span>
      </p>

      <dl>
        <div>
          <dt>{{ 'edge-gateway.api-key.dialog.device-id' | translate }} <code>CLOUD_DEVICE_ID</code></dt>
          <dd>
            <code>{{ data.sensorExternalId }}</code>
            <button
              mat-icon-button
              type="button"
              (click)="copy('sensorExternalId')"
              [matTooltip]="'edge-gateway.api-key.dialog.copy' | translate"
              [attr.aria-label]="('edge-gateway.api-key.dialog.copy' | translate) + ' CLOUD_DEVICE_ID'"
            >
              <mat-icon>{{ copied() === 'sensorExternalId' ? 'check' : 'content_copy' }}</mat-icon>
            </button>
          </dd>
        </div>
        <div>
          <dt>{{ 'edge-gateway.api-key.dialog.key' | translate }} <code>CLOUD_API_KEY</code></dt>
          <dd>
            <code>{{ data.apiKey }}</code>
            <button
              mat-icon-button
              type="button"
              (click)="copy('apiKey')"
              [matTooltip]="'edge-gateway.api-key.dialog.copy' | translate"
              [attr.aria-label]="('edge-gateway.api-key.dialog.copy' | translate) + ' CLOUD_API_KEY'"
            >
              <mat-icon>{{ copied() === 'apiKey' ? 'check' : 'content_copy' }}</mat-icon>
            </button>
          </dd>
        </div>
      </dl>

      <p class="hint">{{ 'edge-gateway.api-key.dialog.hint' | translate }}</p>
      <p class="copied" aria-live="polite">
        @if (copied()) {
          {{ 'edge-gateway.api-key.dialog.copied' | translate }}
        }
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button mat-dialog-close type="button">
        {{ 'edge-gateway.api-key.dialog.close' | translate }}
      </button>
    </mat-dialog-actions>
  `,
})
export class EdgeGatewayApiKeyDialog {
  /**
   * Identifier and API key of the gateway, as the cloud returned them.
   */
  protected readonly data = inject<EdgeGatewayApiKey>(MAT_DIALOG_DATA);

  /**
   * Clipboard used to copy the values.
   */
  private readonly clipboard = inject(Clipboard);

  /**
   * Value last copied to the clipboard, if any.
   */
  protected readonly copied = signal<CopiedField | null>(null);

  /**
   * Copies the identifier or the API key to the clipboard.
   *
   * @param field - Value to copy
   */
  protected copy(field: CopiedField): void {
    if (this.clipboard.copy(this.data[field])) this.copied.set(field);
  }
}
