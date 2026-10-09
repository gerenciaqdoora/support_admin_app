import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor (soporte)', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  const authService = { getAccessToken: vi.fn(() => 'old-access'), refreshToken: vi.fn(), logout: vi.fn() };
  const notification = { warning: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authService },
        { provide: NotificationService, useValue: notification },
      ],
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('renueva una vez y reintenta con el token nuevo', () => {
    authService.refreshToken.mockReturnValue(of('new-access'));
    let body: unknown;

    http.get('/api/v1/tickets').subscribe((r) => (body = r));
    httpMock.expectOne('/api/v1/tickets').flush({}, { status: 401, statusText: 'Unauthorized' });
    const retry = httpMock.expectOne('/api/v1/tickets');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-access');
    retry.flush({ ok: true });

    expect(body).toEqual({ ok: true });
    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('un 422 del reintento se propaga sin cerrar la sesión', () => {
    authService.refreshToken.mockReturnValue(of('new-access'));
    let status = 0;

    http.post('/api/v1/tickets', {}).subscribe({ error: (e) => (status = e.status) });
    httpMock.expectOne('/api/v1/tickets').flush({}, { status: 401, statusText: 'Unauthorized' });
    httpMock.expectOne('/api/v1/tickets').flush({}, { status: 422, statusText: 'Unprocessable' });

    expect(status).toBe(422);
    expect(authService.logout).not.toHaveBeenCalled();
  });

  it('las peticiones en espera fallan (no quedan colgadas) si la renovación falla', () => {
    const refresh$ = new Subject<string>();
    authService.refreshToken.mockReturnValue(refresh$.asObservable());
    const errores: number[] = [];

    http.get('/api/v1/a').subscribe({ error: () => errores.push(1) });
    http.get('/api/v1/b').subscribe({ error: () => errores.push(2) });
    httpMock.expectOne('/api/v1/a').flush({}, { status: 401, statusText: 'Unauthorized' });
    httpMock.expectOne('/api/v1/b').flush({}, { status: 401, statusText: 'Unauthorized' });
    refresh$.error(new Error('vencida'));

    expect(authService.refreshToken).toHaveBeenCalledTimes(1);
    expect(errores.sort()).toEqual([1, 2]);
    expect(authService.logout).toHaveBeenCalledWith(true);
    expect(notification.warning).toHaveBeenCalledTimes(1);
  });

  it('el logout SÍ lleva el access token (si no, el servidor no revoca la sesión)', () => {
    http.post('https://api.qdoora.cl/api/v1/logout/7', {}).subscribe();

    expect(httpMock.expectOne('https://api.qdoora.cl/api/v1/logout/7').request.headers.get('Authorization')).toBe('Bearer old-access');
  });

  it('no envía el access token a /v1/refresh', () => {
    http.post('https://api.qdoora.cl/api/v1/refresh', {}).subscribe();

    expect(httpMock.expectOne('https://api.qdoora.cl/api/v1/refresh').request.headers.has('Authorization')).toBe(false);
  });
});
