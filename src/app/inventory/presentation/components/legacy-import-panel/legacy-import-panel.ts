import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { LegacyMaterial } from '../../../domain/model/legacy-material.entity';

/**
 * Raw materials from before Inventory that can be imported to the catalogue.
 */
@Component({
  selector: 'app-legacy-import-panel',
  standalone: true,
  imports: [DecimalPipe, MatButtonModule, MatIconModule, TranslatePipe],
  templateUrl: './legacy-import-panel.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './legacy-import-panel.css',
})
export class LegacyImportPanel {
  /** Materials waiting to be imported. */
  readonly materials = input.required<readonly LegacyMaterial[]>();

  /** Whether a change is being saved. */
  readonly saving = input(false);

  /** The user asked to import the material with this identifier. */
  readonly importRequested = output<number>();
}
