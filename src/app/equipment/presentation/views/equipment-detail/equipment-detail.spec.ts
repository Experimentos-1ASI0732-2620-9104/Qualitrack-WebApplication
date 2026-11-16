import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { EquipmentDetail } from './equipment-detail';

describe('EquipmentDetail', () => {
  /** An Edge Gateway located in an environment and operational. */
  const gateway = {
    id: 5,
    laboratoryId: 42,
    environmentId: 1,
    name: 'Edge Gateway almacén',
    type: 'EDGE_GATEWAY',
    model: 'Raspberry Pi 4',
    serialNumber: 'RPI-0001',
    status: 'OPERATIONAL',
    deviceType: null,
    sensorExternalId: 'EDGE-001',
    firmwareVersion: null,
    createdAt: '2026-11-01T10:00:00Z',
  };

  afterEach(() => localStorage.clear());

  /** Opens the detail of the gateway with a session of the given role and answers what it reads. */
  async function open(role: string) {
    localStorage.setItem('token', 'test.' + btoa(JSON.stringify({ exp: Date.now() / 1000 + 3600 })) + '.test');
    localStorage.setItem('userId', '27');
    localStorage.setItem('username', 'Detail fixture');
    localStorage.setItem('roles', JSON.stringify([role]));
    localStorage.setItem('laboratoryId', '42');
    TestBed.configureTestingModule({
      imports: [EquipmentDetail],
      providers: [
        provideTranslateService(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ equipmentId: '5' }) } } },
      ],
    });
    // The laboratory comes from the onboarding check, which the page does not run.
    vi.spyOn(TestBed.inject(IamStore), 'requireLaboratoryId').mockReturnValue(42);
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(EquipmentDetail);
    fixture.detectChanges();
    const keyRequests: string[] = [];
    // Answers every request until the page stops asking, keeping the ones for the API key.
    for (let round = 0; round < 5; round++) {
      for (const request of http.match(() => true)) {
        const url = request.request.urlWithParams;
        if (url.endsWith('/api-key')) {
          keyRequests.push(url);
          request.flush({ issued: false });
        } else if (url.endsWith('/equipments/5')) {
          request.flush(gateway);
        } else {
          request.flush([]);
        }
      }
      await fixture.whenStable();
      fixture.detectChanges();
    }
    return { element: fixture.nativeElement as HTMLElement, keyRequests };
  }

  it('reads and shows the API key status to a quality manager', async () => {
    const { element, keyRequests } = await open('ROLE_QA_MANAGER');
    expect(keyRequests).toHaveLength(1);
    expect(element.textContent).toContain('edge-gateway.api-key.title');
    expect(element.textContent).toContain('edge-gateway.api-key.generate');
  });

  it.each(['ROLE_OPERATOR', 'ROLE_AUDITOR'])('neither asks nor shows the API key to %s', async (role) => {
    const { element, keyRequests } = await open(role);
    expect(element.textContent).toContain('Edge Gateway almacén');
    expect(keyRequests).toEqual([]);
    expect(element.textContent).not.toContain('edge-gateway.api-key.title');
  });
});
