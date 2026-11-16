import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ActionBanner } from './action-banner';

describe('ActionBanner', () => {
  function create(actionKey: string | null) {
    TestBed.configureTestingModule({
      imports: [ActionBanner],
      providers: [provideTranslateService()],
    });
    const fixture = TestBed.createComponent(ActionBanner);
    fixture.componentRef.setInput('actionKey', actionKey);
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('is announced as an alert', () => {
    const { element } = create(null);

    expect(element.querySelector('[role="alert"]')).not.toBeNull();
    expect(element.querySelector('button')).toBeNull();
  });

  it('offers the action when it has one', () => {
    const { fixture, element } = create('banner.action');
    const action = vi.fn();
    fixture.componentInstance.action.subscribe(action);

    element.querySelector('button')!.click();

    expect(action).toHaveBeenCalledTimes(1);
  });
});
