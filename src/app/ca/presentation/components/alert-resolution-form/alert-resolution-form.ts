import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

const MIN_NOTES_LENGTH = 10;
const MAX_NOTES_LENGTH = 500;

/**
 * Form to close an alert with its corrective action (US88).
 *
 * @remarks
 * The templates write a usual corrective action, which the person can still edit. They add to what is written, so they
 * never lose it. It only tells the view the notes; saving them is up to the view.
 */
@Component({
  selector: 'app-alert-resolution-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    TranslatePipe,
  ],
  templateUrl: './alert-resolution-form.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './alert-resolution-form.css',
})
export class AlertResolutionForm {
  /** Whether something is being saved. */
  readonly saving = input(false);

  /** Emits the corrective action, trimmed, once it is valid. */
  readonly resolve = output<string>();

  private readonly translate = inject(TranslateService);
  private readonly notesInput = viewChild.required<ElementRef<HTMLTextAreaElement>>('notesInput');

  protected readonly maxNotesLength = MAX_NOTES_LENGTH;

  /** Usual corrective actions. */
  protected readonly templates = ['ventilation', 'filter', 'sensor'];

  protected readonly form = inject(FormBuilder).nonNullable.group({
    notes: [
      '',
      [
        Validators.required,
        Validators.minLength(MIN_NOTES_LENGTH),
        Validators.maxLength(MAX_NOTES_LENGTH),
      ],
    ],
  });

  private readonly notes = this.form.controls.notes;

  /** What is written, to count it. */
  protected readonly writtenNotes = toSignal(this.notes.valueChanges, { initialValue: '' });

  /**
   * Adds a usual corrective action to the notes and leaves the person ready to edit it.
   *
   * @param template - The template chosen
   */
  protected useTemplate(template: string): void {
    const text = this.translate.instant(`ca-alerts.detail.templates.${template}.text`);
    const written = this.notes.value.trim();
    this.notes.setValue(written ? `${written} ${text}` : text);
    this.focus();
  }

  /** Tells the notes when they are valid. */
  protected submit(): void {
    this.notes.setValue(this.notes.value.trim());
    if (this.notes.valid) this.resolve.emit(this.notes.value);
  }

  /** Moves the focus to the notes. */
  focus(): void {
    this.notesInput().nativeElement.focus();
  }

  /** Empties the form, for another alert. */
  reset(): void {
    this.form.reset();
  }
}
