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
