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

  // Verificar si tiene el rol de soporte
  if (!authService.isSupportRole()) {
    // Si está autenticado pero no es soporte, expulsar
    authService.logout();
    return false;
  }

  return true;
};
