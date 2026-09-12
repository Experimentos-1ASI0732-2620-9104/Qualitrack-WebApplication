import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

import { Toolbar } from '../../components/toolbar/toolbar';

/**
 * Public About view for QualiTrack.
 *
 * @remarks
 * Presents the product purpose, platform capabilities, trust signals and team
 * context for visitors evaluating the solution before subscribing.
 */
@Component({
  selector: 'app-about',
  standalone: true,
  imports: [RouterLink, TranslatePipe, Toolbar],
  templateUrl: './about.html',
  styleUrl: './about.css',
})
export class About {
  protected readonly valueItems = [
    {
      icon: 'verified_user',
      title: 'about.value.traceability.title',
      description: 'about.value.traceability.description',
    },
    {
      icon: 'monitoring',
      title: 'about.value.monitoring.title',
      description: 'about.value.monitoring.description',
    },
    {
      icon: 'assignment',
      title: 'about.value.audit.title',
      description: 'about.value.audit.description',
    },
  ];

  protected readonly workflowItems = [
    'about.workflow.items.0',
    'about.workflow.items.1',
    'about.workflow.items.2',
    'about.workflow.items.3',
  ];
}
