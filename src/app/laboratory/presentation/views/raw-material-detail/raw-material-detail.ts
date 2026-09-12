import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { RawMaterialHistoryStore } from '../../../application/raw-material-history.store';
import { IamStore } from '../../../../iam/application/iam.store';

@Component({
  selector: 'app-raw-material-detail', standalone: true,
  imports: [CommonModule, RouterLink, TranslateModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTooltipModule],
  providers: [RawMaterialHistoryStore],
  templateUrl: './raw-material-detail.html', styleUrl: './raw-material-detail.css',
})
export class RawMaterialDetail implements OnInit {
  protected readonly store = inject(RawMaterialHistoryStore);
  private readonly route = inject(ActivatedRoute);
  private readonly iam = inject(IamStore);
  private readonly params = this.route.paramMap.pipe(takeUntilDestroyed());
  private materialId = 0;

  ngOnInit(): void {
    this.params.subscribe(params => { this.materialId = Number(params.get('id')); this.reload(); });
  }

  protected reload(): void {
    this.store.load(this.iam.requireLaboratoryId(), this.materialId);
  }
}
