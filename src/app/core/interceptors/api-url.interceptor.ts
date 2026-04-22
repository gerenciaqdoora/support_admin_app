import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  // Solo interceptar peticiones relativas que apunten a nuestra API
  if (req.url.startsWith('/api') || req.url.startsWith('/v1')) {
    const apiReq = req.clone({
      url: `${environment.apiUrl}${req.url.replace(/^\/api/, '')}`
    });
    return next(apiReq);
  }
  return next(req);
};
