import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { StatusChip } from './status-chip';

describe('StatusChip', () => {
  it('shows the color, the icon and the text of the status', () => {
    TestBed.configureTestingModule({
      imports: [StatusChip],
      providers: [provideTranslateService()],
    });
    const fixture = TestBed.createComponent(StatusChip);
    fixture.componentRef.setInput('tone', 'danger');
    fixture.componentRef.setInput('icon', 'error');
    fixture.componentRef.setInput('labelKey', 'status.critical');
    fixture.detectChanges();

    const chip = fixture.nativeElement.querySelector('.status-chip') as HTMLElement;
    expect(chip.classList).toContain('tone-danger');
    expect(chip.querySelector('mat-icon')?.textContent).toBe('error');
    expect(chip.querySelector('mat-icon')?.getAttribute('aria-hidden')).toBe('true');
    expect(chip.textContent).toContain('status.critical');
  });
});
