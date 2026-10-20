import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SubscriberService } from './subscriber.service';

describe('SubscriberService.changePlan', () => {
  it('envía el cambio de plan al endpoint del suscriptor', () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    const service = TestBed.inject(SubscriberService);
    const httpMock = TestBed.inject(HttpTestingController);

    service.changePlan(7, { plan_slug: 'empresa-pro', reason: 'Upgrade' }).subscribe();

    const req = httpMock.expectOne('/api/v1/support/subscribers/7/plan');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ plan_slug: 'empresa-pro', reason: 'Upgrade' });
    req.flush({ data: {} });
  });
});

describe('SubscriberService capacidad y plazos', () => {
  function setup() {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    return { service: TestBed.inject(SubscriberService), httpMock: TestBed.inject(HttpTestingController) };
  }

  it('extiende el plan, da y revoca cupos en las rutas del suscriptor', () => {
    const { service, httpMock } = setup();

    service.extendPlan(7, { ends_at: '2026-12-01', reason: 'Pago' }).subscribe();
    expect(httpMock.expectOne('/api/v1/support/subscribers/7/plan/extend').request.body).toEqual({ ends_at: '2026-12-01', reason: 'Pago' });

    service.grantAddon(7, { dimension: 'users', quantity: 2, reason: 'Campaña' }).subscribe();
    expect(httpMock.expectOne('/api/v1/support/subscribers/7/addons').request.method).toBe('POST');

    service.revokeAddon(7, 3, 'Fin').subscribe();
    expect(httpMock.expectOne('/api/v1/support/subscribers/7/addons/3/revoke').request.body).toEqual({ reason: 'Fin' });
  });

  it('consulta capacidad y vencimientos', () => {
    const { service, httpMock } = setup();

    service.getCapacity(7).subscribe();
    httpMock.expectOne('/api/v1/support/subscribers/7/capacity');

    service.getExpirations('past_due', 1).subscribe();
    const req = httpMock.expectOne((r) => r.url === '/api/v1/support/subscriptions/expirations');
    expect(req.request.params.get('group')).toBe('past_due');
    expect(req.request.params.get('page')).toBe('1');
  });
});
