import { Component, OnInit, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDivider } from '@angular/material/list';
import { TranslateModule } from '@ngx-translate/core';

import { CaStore } from '../../../application/ca.store';
import { UpdateNotificationPreferenceRequest } from '../../../infrastructure/notification-preference.request';
import { IamStore } from '../../../../iam/application/iam.store';
import { AlertSeverity } from '../../../domain/model/deviation-alert.entity';

@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatDivider,
    MatSelectModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    TranslateModule,
  ],
  templateUrl: './notification-settings.html',
  styleUrl: './notification-settings.css',
})
export class NotificationSettings implements OnInit {
  protected readonly store = inject(CaStore);
  private readonly fb = inject(FormBuilder);
  protected readonly iamStore = inject(IamStore);

  settingsForm!: FormGroup;

  private get currentUserId(): number {
    return this.iamStore.requireUserId();
  }

  constructor() {
    this.initForm();

    effect(() => {
      const pref = this.store.preference();

      if (pref) {
        this.settingsForm.patchValue(
          {
            emailEnabled: pref.emailEnabled,
            smsEnabled: pref.smsEnabled,
            inAppEnabled: pref.inAppEnabled,
            minimumSeverity: pref.minimumSeverity,
          },
          { emitEvent: false },
        );
      }
    });
  }

  ngOnInit(): void {
    this.store.loadNotificationPreferences(this.currentUserId);
  }

  private initForm(): void {
    this.settingsForm = this.fb.group({
      emailEnabled: [true],
      smsEnabled: [false],
      inAppEnabled: [true],
      minimumSeverity: ['WARNING' as AlertSeverity, Validators.required],
    });
  }

  onSubmit(): void {
    if (this.settingsForm.invalid) return;

    const request: UpdateNotificationPreferenceRequest = {
      emailEnabled: this.settingsForm.value.emailEnabled,
      smsEnabled: this.settingsForm.value.smsEnabled,
      inAppEnabled: this.settingsForm.value.inAppEnabled,
      minimumSeverity: this.settingsForm.value.minimumSeverity as AlertSeverity,
    };

    this.store.updateNotificationPreferences(this.currentUserId, request);
  }
}
