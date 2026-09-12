import { Component, OnInit, Signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';

import { CaStore } from '../../../application/ca.store';
import { DeviationAlert } from '../../../domain/model/deviation-alert.entity';
import { IamStore } from '../../../../iam/application/iam.store';

@Component({
  selector: 'app-deviation-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    TranslateModule,
  ],
  templateUrl: './deviation-detail.html',
  styleUrl: './deviation-detail.css',
})
export class DeviationDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  protected readonly store = inject(CaStore);
  protected readonly iamStore = inject(IamStore);

  /**
   * The unique numeric identifier of the alert being viewed, retrieved from the URL.
   */
  alertId: number = 0;

  /**
   * Reactive Signal containing the details of the specific deviation alert.
   */
  alert!: Signal<DeviationAlert | undefined>;

  /**
   * Reactive form group used to capture alert resolution notes.
   */
  resolutionForm!: FormGroup;

  /**
   * Gets the currently authenticated user numeric identifier.
   *
   * @remarks
   * Requires the authenticated identity; no testing identifier is used at runtime.
   */
  private get currentUserId(): number {
    return this.iamStore.requireUserId();
  }

  /**
   * Initializes the component by extracting the alert ID from the route,
   * binding the alert signal, loading the alert details, and creating the resolution form.
   */
  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    this.alertId = idParam ? Number(idParam) : 0;

    this.alert = this.store.getAlertById(this.alertId);

    this.resolutionForm = this.fb.group({
      resolutionNotes: ['', [Validators.required, Validators.minLength(10)]],
    });

    if (this.alertId) {
      this.store.loadAlertById(this.alertId);
    }
  }

  /**
   * Resolves the current deviation alert.
   *
   * @remarks
   * Sends the current user ID and the resolution notes to the CA store,
   * which delegates the operation to the backend lifecycle endpoint.
   */
  resolveAlert(): void {
    if (!this.alertId || this.resolutionForm.invalid) return;

    this.store.resolveAlert(this.alertId, {
      resolvedBy: this.currentUserId,
      resolutionNotes: this.resolutionForm.value.resolutionNotes,
    });
  }
}
