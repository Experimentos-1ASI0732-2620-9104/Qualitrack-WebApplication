import { Component, OnDestroy, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';
import { RaStore } from '../../../application/ra.store';

/** Data injected into the preview dialog. */
export interface PreviewDialogData {
  /** PDF of the report generated for the preview. */
  file: Blob;
  /** Translation key of the report type. */
  title: string;
}

/**
 * Modal dialog to display a preview of the generated PDF.
 *
 * @remarks
 * It renders the report generated for the preview inside an iframe. Downloading it from here reuses that report
 * through {@link RaStore.downloadPreview}, so the platform does not generate and store it twice.
 */
@Component({
  imports: [
    MatIcon,
    MatDialogContent,
    MatDialogTitle,
    MatButton,
    MatIconButton,
    MatTooltip,
    TranslatePipe
  ],
  selector: 'app-report-preview-dialog',
  styleUrl: './report-preview-dialog.css',
  templateUrl: './report-preview-dialog.html',
})
export class ReportPreviewDialog implements OnDestroy {
  /** The data injected by MatDialog: the PDF and the report type. */
  protected readonly data = inject<PreviewDialogData>(MAT_DIALOG_DATA);

  private readonly dialogRef = inject(MatDialogRef<ReportPreviewDialog>);

  private readonly store = inject(RaStore);

  /** Temporary URL of the PDF, released when the dialog closes. */
  private readonly fileUrl = URL.createObjectURL(this.data.file);

  /** The URL of the PDF, trusted for the iframe. */
  protected readonly pdfUrl: SafeResourceUrl = inject(DomSanitizer).bypassSecurityTrustResourceUrl(this.fileUrl);

  /** Releases the temporary URL of the PDF. */
  ngOnDestroy(): void {
    URL.revokeObjectURL(this.fileUrl);
  }

  /** Downloads the previewed report and closes the dialog. */
  protected download(): void {
    this.store.downloadPreview();
    this.dialogRef.close();
  }

  /** Closes the modal dialog. */
  protected close(): void {
    this.dialogRef.close();
  }
}
