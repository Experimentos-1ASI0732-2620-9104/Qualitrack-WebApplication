import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { UndoToast, UndoToastOpener, UndoToastOutcome } from './undo-toast';

describe('UndoToastOpener', () => {
  const openFromComponent = vi.fn();
  const snackBarDismiss = vi.fn();

  beforeEach(() => {
    openFromComponent.mockReset();
    snackBarDismiss.mockReset();
    TestBed.configureTestingModule({
      providers: [
        { provide: MatSnackBar, useValue: { openFromComponent, dismiss: snackBarDismiss } },
      ],
    });
  });

  function outcomeWhen(dismissedByAction: boolean): UndoToastOutcome | undefined {
    openFromComponent.mockReturnValue({ afterDismissed: () => of({ dismissedByAction }) });
    let outcome: UndoToastOutcome | undefined;
    TestBed.inject(UndoToastOpener)
      .open({ messageKey: 'alert.in-progress' })
      .subscribe((value) => (outcome = value));
    return outcome;
  }

  it('reports undone only when the person pressed the button', () => {
    expect(outcomeWhen(true)).toBe('undone');
    expect(outcomeWhen(false)).toBe('confirmed');
    expect(openFromComponent).toHaveBeenCalledWith(
      UndoToast,
      expect.objectContaining({
        data: { messageKey: 'alert.in-progress' },
        politeness: 'polite',
      }),
    );
  });

  it('closes the toast on screen on demand', () => {
    TestBed.inject(UndoToastOpener).confirmNow();

    expect(snackBarDismiss).toHaveBeenCalledOnce();
  });
});
