import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verificar si está autenticado
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // Verificar si tiene el rol de acceso al portal (Soporte o Admin)
  if (!authService.hasPortalAccess()) {
    // Si está autenticado pero no tiene el rol permitido, expulsar
    authService.logout();
    return false;
  }

  return true;
};
