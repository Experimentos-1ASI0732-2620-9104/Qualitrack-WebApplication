import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { ReportGeneratorState, ReportType } from '../../views/report-generator/report-generator.state';

/**
 * Component that displays the selectable cards for the different report types.
 *
 * @remarks
 * It uses the shared `ReportGeneratorState` to keep track of the active selection
 * and visually highlights the selected card.
 */
@Component({
  selector: 'app-report-type-selector',
  standalone: true,
  imports: [CommonModule, MatIconModule, TranslatePipe],
  templateUrl: './report-type-selector.html',
  styleUrl: './report-type-selector.css'
})
export class ReportTypeSelector {
  /** The shared state managing the selected report type. */
  protected state = inject(ReportGeneratorState);

  /** The static configuration for the available report type cards. */
  protected readonly options = [
    { id: 'batch' as ReportType, icon: 'inventory_2', titleKey: 'report-generator.batch.title', descKey: 'report-generator.batch.desc', format: 'PDF · CSV' },
    { id: 'compliance' as ReportType, icon: 'verified', titleKey: 'report-generator.compliance.title', descKey: 'report-generator.compliance.desc', format: 'PDF · CSV' },
    { id: 'inventory' as ReportType, icon: 'inventory', titleKey: 'report-generator.inventory.title', descKey: 'report-generator.inventory.desc', format: 'PDF · CSV' },
    { id: 'equipment' as ReportType, icon: 'precision_manufacturing', titleKey: 'report-generator.equipment.title', descKey: 'report-generator.equipment.desc', format: 'PDF · CSV' }
  ];
}
