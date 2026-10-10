import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

import { EnvironmentStore } from '../../../application/environment.store';
import { ENVIRONMENT_USAGES, EnvironmentUsage } from '../../../domain/model/environment-usage';

/**
 * Component that registers (US30) or updates (US33) an environment of the current laboratory.
 *
 * @remarks
 * When registering, the optional usage (US31) is assigned right after the environment is created.
 * When editing, the usage is shown read-only because it changes through a usage assignment.
 */
@Component({
  selector: 'app-environment-form',
  standalone: true,
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
  ],
  templateUrl: './environment-form.html',
  styleUrl: './environment-form.css',
})
export class EnvironmentForm implements OnInit {
  /**
   * Store that manages the environments of the current laboratory.
   */
  protected readonly store = inject(EnvironmentStore);

  /**
   * Form builder used to create the environment form.
   */
  private readonly fb = inject(FormBuilder);

  /**
   * Router used to navigate after user actions.
   */
  private readonly router = inject(Router);

  /**
   * Current route, which carries the identifier of the environment being edited.
   */
  private readonly route = inject(ActivatedRoute);

  /**
   * Usages offered when registering an environment.
   */
  protected readonly usages = ENVIRONMENT_USAGES;

  /**
   * Identifier of the environment being edited, or null when registering.
   */
  protected readonly environmentId = signal<number | null>(null);

  /**
   * Current usage of the environment being edited.
   */
  protected readonly currentUsage = signal<EnvironmentUsage | null>(null);

  /**
   * Reactive form used to capture the environment data.
   */
  protected readonly form = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.maxLength(30)]],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', [Validators.maxLength(255)]],
    usage: this.fb.control<EnvironmentUsage | null>(null),
  });

  /**
   * Lifecycle hook that, when editing, loads the environment and hydrates the form.
   *
   * @returns A promise that resolves when the environment is loaded
   */
  async ngOnInit(): Promise<void> {
    this.store.clearError();
    const id = Number(this.route.snapshot.paramMap.get('environmentId'));
    if (!Number.isInteger(id) || id <= 0) return;

    this.environmentId.set(id);
    const environment = await this.store.loadEnvironment(id);
    if (!environment) return;
    this.currentUsage.set(environment.usage);
    this.form.patchValue({
      code: environment.code,
      name: environment.name,
      description: environment.description ?? '',
    });
  }

  /**
   * Indicates whether the form edits an existing environment.
   */
  protected get isEdit(): boolean {
    return this.environmentId() !== null;
  }

  /**
   * Registers or updates the environment and returns to the environment list when saved.
   *
   * @returns A promise that resolves when the operation finishes
   */
  protected async onSubmit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const data = {
      code: value.code.trim(),
      name: value.name.trim(),
      description: value.description.trim() || null,
    };
    const id = this.environmentId();
    const saved = id === null
      ? await this.store.register({ ...data, usage: value.usage })
      : await this.store.update(id, data);
    if (saved) await this.router.navigate(['/laboratories/environments']);
  }

  /**
   * Discards the changes and returns to the environment list.
   */
  protected onCancel(): void {
    void this.router.navigate(['/laboratories/environments']);
  }
}
