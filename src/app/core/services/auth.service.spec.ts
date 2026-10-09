import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from './auth.service';

describe('AuthService (soporte)', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    sessionStorage.setItem('support_access_token', 'a1');
    sessionStorage.setItem('support_refresh_token', 'r1');
    sessionStorage.setItem('support_user', JSON.stringify({ id: 7, role: 'SUPPORT_ROLE' }));
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => sessionStorage.clear());

  it('renueva con el refresh y conserva el usuario aunque /v1/refresh no traiga user', () => {
    let accessToken: string | undefined;

    service.refreshToken().subscribe((token) => (accessToken = token));
    const req = httpMock.expectOne('/v1/refresh');
    expect(req.request.headers.get('Authorization')).toBe('Bearer r1');
    req.flush({ data: { access_token: 'a2', refresh_token: 'r2' } });

    expect(accessToken).toBe('a2');
    expect(service.getAccessToken()).toBe('a2');
    expect(service.getRefreshToken()).toBe('r2');
    expect(service.currentUser()?.id).toBe(7);
  });

  it('clearLocalSession limpia sin navegar', () => {
    service.clearLocalSession();

    expect(service.getAccessToken()).toBeNull();
    expect(service.currentUser()).toBeNull();
  });
});
