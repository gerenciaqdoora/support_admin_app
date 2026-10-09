import { ApplicationConfig, provideZonelessChangeDetection, provideAppInitializer, inject, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { registerLocaleData } from '@angular/common';
import localeEsCl from '@angular/common/locales/es-CL';
import { authInterceptor } from '@core/interceptors/auth.interceptor';
import { routes } from './app.routes';
import { apiUrlInterceptor } from './core/interceptors/api-url.interceptor';
import { provideIcons } from '@core/icons/icons.provider';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';
import { TabSessionService } from './core/services/tab-session.service';

registerLocaleData(localeEsCl);

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([apiUrlInterceptor, authInterceptor])),
    provideAnimationsAsync(),
    provideAppInitializer(() => {
      const tabSession = inject(TabSessionService);
      const authService = inject(AuthService);
      const notification = inject(NotificationService);
      // Corre antes de la primera navegación: la copia nunca llega a usar el refresh de la original
      return tabSession.detectDuplicate().then((duplicate) => {
        if (duplicate) {
          authService.clearLocalSession();
          notification.info('Esta pestaña es una copia de otra abierta. Inicia sesión para usarla.');
        }
      });
    }),
    { provide: LOCALE_ID, useValue: 'es-CL' },
    ...provideIcons()
  ]
};
