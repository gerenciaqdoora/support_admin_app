import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError, BehaviorSubject, catchError, filter, switchMap, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();

  let authReq = req;

  // Añadir el token a las cabeceras si existe y no es una ruta de autenticación
  if (token && !req.url.includes('/login') && !req.url.includes('/refresh')) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: any) => {
      // Manejar error 401 Unauthorized
      // Evitamos bucles infinitos si falla el refresh o el logout
      const isAuthRoute = req.url.includes('/login') || req.url.includes('/refresh') || req.url.includes('/logout');

      if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthRoute) {
        return handle401Error(authReq, next, authService);
      }

      // Si el error es 401 en una ruta de auth (ej: falló el refresh), limpiamos sesión inmediatamente
      if (error instanceof HttpErrorResponse && error.status === 401 && (req.url.includes('/refresh') || req.url.includes('/logout'))) {
        authService.logout(true);
      }

      return throwError(() => error);
    })
  );
};

function handle401Error(request: HttpRequest<unknown>, next: HttpHandlerFn, authService: AuthService): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((token: any) => {
        isRefreshing = false;
        refreshTokenSubject.next(token.access_token);
        
        return next(request.clone({
          setHeaders: {
            Authorization: `Bearer ${token.access_token}`
          }
        }));
      }),
      catchError((err: any) => {
        isRefreshing = false;
        authService.logout(true);
        return throwError(() => err);
      })
    );
  } else {
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(jwt => {
        return next(request.clone({
          setHeaders: {
            Authorization: `Bearer ${jwt}`
          }
        }));
      })
    );
  }
}
