import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { MeasurementApiEndpoint } from './measurement-api-endpoint';
import { ActuationEventApiEndpoint } from './actuation-event-api-endpoint';
import { EnvironmentalProfileApiEndpoint } from './environmental-profile-api-endpoint';
import { Measurement } from '../domain/model/measurement.entity';
import { ActuationEvent } from '../domain/model/actuation-event.entity';
import { EnvironmentalProfile } from '../domain/model/environmental-profile.entity';

describe('Separated telemetry endpoints', () => {
  const period = { from: '2026-10-01T00:00:00Z', to: '2026-10-02T00:00:00Z' };
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }));
  afterEach(() => TestBed.inject(HttpTestingController).verify());
  it.each([null, 4])('preserves the measurement route and metric filter for target %s', (deviceId) => {
    const next = vi.fn(); new MeasurementApiEndpoint(TestBed.inject(HttpClient)).getMeasurements({ laboratoryId: 1, environmentId: 3, deviceId }, period, 'TEMPERATURE').subscribe(next);
    const url = environment.serverBasePath + '/laboratories/1/environments/3' + (deviceId === null ? '' : '/container-monitors/4') + '/telemetry-measurements';
    const request = TestBed.inject(HttpTestingController).expectOne(r => r.url === url);
    expect(request.request.params.get('from')).toBe(period.from); expect(request.request.params.get('to')).toBe(period.to);
    expect(request.request.params.get('metric')).toBe('TEMPERATURE');
    request.flush([{ id: 1, deviceId: 4, environmentId: 3, metric: 'TEMPERATURE', value: 0, textValue: null, unit: 'C', measuredAt: period.from, state: 'CRITICAL', thresholdValue: 2, profileVersion: 1 }]);
    const reading = next.mock.calls[0][0][0]; expect(reading).toBeInstanceOf(Measurement); expect(reading.value).toBe(0); expect(reading.isDeviation).toBe(true);
  });
  it('retains failed actuation events and the unfiltered period query', () => {
    const next = vi.fn(); new ActuationEventApiEndpoint(TestBed.inject(HttpClient)).getActuationEvents({ laboratoryId: 1, environmentId: 3, deviceId: 4 }, period).subscribe(next);
    const request = TestBed.inject(HttpTestingController).expectOne(r => r.url.endsWith('/container-monitors/4/actuation-events'));
    expect(request.request.params.keys().sort()).toEqual(['from', 'to']);
    request.flush([{ id: 2, deviceId: 4, environmentId: 3, action: 'COOLING_ON', triggerMetric: 'TEMPERATURE', triggerState: 'CRITICAL', result: 'FAILED', occurredAt: period.from, profileVersion: 1 }]);
    expect(next.mock.calls[0][0][0]).toBeInstanceOf(ActuationEvent); expect(next.mock.calls[0][0][0].result).toBe('FAILED');
  });
  it('treats a missing environmental profile as unconfigured', () => {
    const next = vi.fn(); new EnvironmentalProfileApiEndpoint(TestBed.inject(HttpClient)).getProfile({ laboratoryId: 1, environmentId: 3, deviceId: null }).subscribe(next);
    TestBed.inject(HttpTestingController).expectOne(environment.serverBasePath + '/laboratories/1/environments/3/environmental-profile').flush({}, { status: 404, statusText: 'Not Found' });
    expect(next).toHaveBeenCalledWith(null);
  });
  it('preserves zero thresholds and the profile used to evaluate readings', () => {
    const next = vi.fn(); new EnvironmentalProfileApiEndpoint(TestBed.inject(HttpClient)).getProfile({ laboratoryId: 1, environmentId: 3, deviceId: 4 }).subscribe(next);
    TestBed.inject(HttpTestingController).expectOne(environment.serverBasePath + '/laboratories/1/environments/3/container-monitors/4/environmental-profile').flush({ id: 2, scope: 'CONTAINER_MONITOR', laboratoryId: 1, environmentId: 3, deviceId: 4, version: 2, thresholds: [{ metric: 'TEMPERATURE', normalMin: 0, normalMax: 8, criticalMin: null, criticalMax: 10 }], actuationRules: [{ metric: 'TEMPERATURE', state: 'CRITICAL', action: 'COOLING_ON' }], updatedAt: null, updatedBy: null });
    const profile = next.mock.calls[0][0]; expect(profile).toBeInstanceOf(EnvironmentalProfile);
    expect(profile.threshold('TEMPERATURE').normalMin).toBe(0); expect(profile.threshold('TEMPERATURE').unit).toBe('');
    expect(profile.actuationRules[0]).toEqual({ metric: 'TEMPERATURE', state: 'CRITICAL', action: 'COOLING_ON' });
  });
});
