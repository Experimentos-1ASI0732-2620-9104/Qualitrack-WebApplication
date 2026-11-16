import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Routes } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';

import { RaStore } from '../../../application/ra.store';
import { Dashboard } from './dashboard';

@Component({ selector: 'app-test-notice', template: 'The notice' })
class TestNotice {}

describe('Dashboard', () => {
  const reloadOverview = vi.fn();
  // Every reading of the store is still loading, which is all the template needs here.
  const loading = Object.assign([], { status: 'loading', data: null });
  const store = new Proxy({ reloadOverview }, {
    get: (target, key) => (key === 'reloadOverview' ? target.reloadOverview : () => loading),
  });

  async function open(data: Routes[number]['data']) {
    TestBed.configureTestingModule({
      providers: [
        provideTranslateService(),
        provideRouter([{ path: '', component: Dashboard, data }]),
        { provide: RaStore, useValue: store },
      ],
    });
    const harness = await RouterTestingHarness.create('/');
    return harness.routeNativeElement as HTMLElement;
  }

  beforeEach(() => reloadOverview.mockClear());

  it('loads the overview', async () => {
    await open({});
    expect(reloadOverview).toHaveBeenCalledTimes(1);
  });

  it('renders the notice that the route hands over', async () => {
    const page = await open({ noticeComponent: TestNotice });
    expect(page.querySelector('app-test-notice')?.textContent).toBe('The notice');
  });

  it('renders the page without a notice when the route hands none', async () => {
    const page = await open({});
    expect(page.querySelector('main.dashboard')).not.toBeNull();
    expect(page.querySelector('app-test-notice')).toBeNull();
  });
});
