import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { IamStore } from '../../../../iam/application/iam.store';
import { Toolbar } from '../../../../shared/presentation/components/toolbar/toolbar';
import { TranslateModule } from '@ngx-translate/core';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { LaboratoryStore } from '../../../application/laboratory.store';
import { CreateLaboratoryCommand } from '../../../domain/model/create-laboratory.command';

/**
 * Component responsible for creating a new laboratory.
 *
 * @remarks
 * This presentation component captures laboratory registration data through a
 * reactive form and dispatches a create laboratory command to the Laboratory store.
 */
@Component({
  selector: 'app-lab-form',
  standalone: true,
  providers: [LaboratoryStore],
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatIconModule,
    Toolbar,
  ],
  templateUrl: './lab-form.html',
  styleUrl: './lab-form.css',
})
export class LabForm {
  /**
   * Store that manages Laboratory bounded context state.
   */
  protected readonly store = inject(LaboratoryStore);

  /**
   * Form builder used to create the laboratory registration form.
   */
  private readonly fb = inject(FormBuilder);

  /**
   * Router used to navigate after user actions.
   */
  private readonly router = inject(Router);
  private readonly iam = inject(IamStore);

  /**
   * Available regulation options shown in the laboratory form.
   */
  protected readonly regulations = ['BPM_DIGEMID', 'ISO_9001', 'ISO_13485', 'GMP_WHO'];

  /**
   * Reactive form used to capture laboratory registration data.
   */
  protected readonly form: FormGroup = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    ruc: ['', [Validators.required, Validators.pattern(/^[0-9]{11}$/)]],
    address: ['', Validators.required],
    phone: ['', Validators.required],
    applicableRegulations: [[], Validators.required],
  });

  /**
   * Submits the laboratory form and dispatches a create laboratory command.
   */
  protected onSubmit(): void {
    if (this.form.invalid || this.store.isLoading()) {
      this.form.markAllAsTouched();
      return;
    }

    const command: CreateLaboratoryCommand = this.form.getRawValue();
    this.store.createLaboratory(command, () => {
      this.iam.invalidateOnboarding();
      void this.router.navigate(['/iam/onboarding']);
    });
  }

  /**
   * Cancels laboratory registration and returns to the laboratory profile.
   */
  protected onCancel(): void {
    this.iam.signOut(this.router);
  }
}
