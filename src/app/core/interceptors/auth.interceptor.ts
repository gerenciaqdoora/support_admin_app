import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, catchError, finalize, shareReplay, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { isAuthEndpoint } from './auth-endpoints';

const SESSION_EXPIRED_MESSAGE = 'Tu sesión expiró. Inicia sesión nuevamente.';
const NOTICE_WINDOW_MS = 2000;

// Una sola renovación en curso: las peticiones que reciben 401 mientras tanto la comparten (y su error)
let refreshInFlight$: Observable<string> | null = null;
let lastExpiredNoticeAt = 0;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const notification = inject(NotificationService);
  const authRequest = isAuthEndpoint(req.url);
  const withToken = (token: string) => req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

  const expireSession = (): void => {
    if (Date.now() - lastExpiredNoticeAt > NOTICE_WINDOW_MS) {
      notification.warning(SESSION_EXPIRED_MESSAGE);
      lastExpiredNoticeAt = Date.now();
    }
    authService.logout(true);
  };

  const token = authService.getAccessToken();
  const outgoing = token && !authRequest ? withToken(token) : req;

  return next(outgoing).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401) {
        return throwError(() => error);
      }

      // 401 en refresh/logout: la sesión ya no sirve
      if (authRequest) {
        authService.logout(true);
        return throwError(() => error);
      }

      return refreshOnce(authService).pipe(
        catchError((refreshError) => {
          expireSession();
          return throwError(() => refreshError);
        }),
        // Los errores del reintento (422, 403, 500) se propagan tal cual; solo un 401 cierra la sesión
        switchMap((accessToken) => next(withToken(accessToken)).pipe(
          catchError((retryError: unknown) => {
            if (retryError instanceof HttpErrorResponse && retryError.status === 401) {
              expireSession();
            }
            return throwError(() => retryError);
          })
        ))
      );
    })
  );
};

function refreshOnce(authService: AuthService): Observable<string> {
  if (!refreshInFlight$) {
    refreshInFlight$ = authService.refreshToken().pipe(
      finalize(() => { refreshInFlight$ = null; }),
      shareReplay({ bufferSize: 1, refCount: false })
    );
  }
  return refreshInFlight$;
}
