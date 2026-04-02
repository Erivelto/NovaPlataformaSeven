import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getUserData();
  const userType = user?.tipo?.toLowerCase();
  const isAdmin = userType === 'a' || userType === 'admin';

  if (isAdmin) {
    return true;
  }

  return router.createUrlTree(['/acesso-negado']);
};