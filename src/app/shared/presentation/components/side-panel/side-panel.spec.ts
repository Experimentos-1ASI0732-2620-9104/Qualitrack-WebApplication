import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { SidePanel } from './side-panel';

@Component({
  imports: [SidePanel],
  template: `
    <button id="origin" type="button" (click)="open.set(true)">Open</button>
    @if (open()) {
      <app-side-panel
        titleText="Alert 7"
        subtitle="Cold room"
        (closed)="closedCount = closedCount + 1"
      >
        <span sidePanelOverline class="overline">Critical</span>
        <p class="content">Details</p>
        <button sidePanelActions class="action" type="button">Save</button>
      </app-side-panel>
    }
  `,
})
class Host {
  readonly open = signal(false);
  closedCount = 0;
  readonly panel = viewChild(SidePanel);
}

describe('SidePanel', () => {
  async function render() {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(Host);
    document.body.appendChild(fixture.nativeElement);
    await fixture.whenStable();
    const origin = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '#origin',
    )!;
    origin.focus();
    origin.click();
    await fixture.whenStable();
    return { fixture, element: document.body, origin };
  }

  afterEach(() =>
    document.body
      .querySelectorAll('[ng-version], .cdk-overlay-container')
      .forEach((item) => item.remove()),
  );

  it('opens over everything else, in an overlay', async () => {
    const { fixture } = await render();
    expect(document.querySelector('.cdk-overlay-container [role="dialog"]')).not.toBeNull();

    fixture.componentInstance.open.set(false);
    await fixture.whenStable();
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });

  it('is a modal dialog named after its title', async () => {
    const { element } = await render();
    const dialog = element.querySelector('[role="dialog"]')!;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    const title = element.querySelector(`#${dialog.getAttribute('aria-labelledby')}`);
    expect(title?.textContent).toContain('Alert 7');
  });

  it('shows what the view projects where it belongs', async () => {
    const { element } = await render();
    expect(element.querySelector('.heading .overline')?.textContent).toBe('Critical');
    expect(element.querySelector('.panel-body .content')?.textContent).toBe('Details');
    expect(element.querySelector('.panel-footer .action')?.textContent).toBe('Save');
    expect(element.querySelector('.subtitle')?.textContent).toBe('Cold room');
  });

  it('asks to close with Escape, the backdrop and the close button', async () => {
    const { fixture, element } = await render();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    element.querySelector<HTMLElement>('.backdrop')!.click();
    element.querySelector<HTMLElement>('.panel-header button')!.click();
    expect(fixture.componentInstance.closedCount).toBe(3);
  });

  it('takes the focus on opening and gives it back on closing', async () => {
    const { fixture, element, origin } = await render();
    expect(document.activeElement).toBe(element.querySelector('.title'));

    fixture.componentInstance.open.set(false);
    await fixture.whenStable();
    expect(document.activeElement).toBe(origin);
  });

  it('moves the focus to the title when asked', async () => {
    const { fixture, element } = await render();
    element.querySelector<HTMLElement>('.action')!.focus();
    fixture.componentInstance.panel()!.focusTitle();
    expect(document.activeElement).toBe(element.querySelector('.title'));
  });
});
