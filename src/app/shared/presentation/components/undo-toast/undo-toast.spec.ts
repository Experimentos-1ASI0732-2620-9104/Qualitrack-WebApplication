import { TestBed } from '@angular/core/testing';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';
import { provideTranslateService } from '@ngx-translate/core';
import { UndoToast } from './undo-toast';

describe('UndoToast', () => {
  const dismiss = vi.fn();
  const dismissWithAction = vi.fn();

  function create() {
    TestBed.configureTestingModule({
      imports: [UndoToast],
      providers: [
        provideTranslateService(),
        {
          provide: MAT_SNACK_BAR_DATA,
          useValue: { messageKey: 'alert.in-progress', durationMs: 5000 },
        },
        { provide: MatSnackBarRef, useValue: { dismiss, dismissWithAction } },
      ],
    });
    const fixture = TestBed.createComponent(UndoToast);
    fixture.detectChanges();
    const toast = fixture.nativeElement.querySelector('.undo-toast') as HTMLElement;
    return { fixture, toast };
  }

  beforeEach(() => {
    vi.useFakeTimers();
    dismiss.mockClear();
    dismissWithAction.mockClear();
  });

  afterEach(() => vi.useRealTimers());

  it('closes when the time runs out and counts down the seconds on the way', () => {
    const { fixture } = create();
    const countdown = () => fixture.nativeElement.querySelector('.countdown').textContent;
    expect(countdown()).toContain('5 s');

    vi.advanceTimersByTime(3000);
    fixture.detectChanges();
    expect(countdown()).toContain('2 s');
    expect(dismiss).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2000);
    expect(dismiss).toHaveBeenCalledOnce();
    expect(dismissWithAction).not.toHaveBeenCalled();
  });

  it('reports that the action was undone when the button is pressed', () => {
    const { fixture } = create();

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();

    expect(dismissWithAction).toHaveBeenCalledOnce();
  });

  it('stops the time and the bar while the pointer is on the toast', () => {
    const { fixture, toast } = create();
    vi.advanceTimersByTime(1500);

    toast.dispatchEvent(new Event('pointerenter'));
    fixture.detectChanges();
    vi.advanceTimersByTime(60_000);
    expect(dismiss).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.progress-bar').classList).toContain('paused');

    toast.dispatchEvent(new Event('pointerleave'));
    fixture.detectChanges();
    vi.advanceTimersByTime(3499);
    expect(dismiss).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(dismiss).toHaveBeenCalledOnce();
  });

  it('keeps the time stopped until both the pointer and the focus leave', () => {
    const { fixture, toast } = create();

    toast.dispatchEvent(new Event('pointerenter'));
    toast.dispatchEvent(new Event('focusin'));
    fixture.detectChanges();
    toast.dispatchEvent(new Event('pointerleave'));
    fixture.detectChanges();
    vi.advanceTimersByTime(60_000);
    expect(dismiss).not.toHaveBeenCalled();

    toast.dispatchEvent(new Event('focusout'));
    fixture.detectChanges();
    vi.advanceTimersByTime(5000);
    expect(dismiss).toHaveBeenCalledOnce();
  });

  it('stops counting when it is destroyed', () => {
    const { fixture } = create();

    fixture.destroy();
    vi.advanceTimersByTime(5000);

    expect(dismiss).not.toHaveBeenCalled();
  });
});
