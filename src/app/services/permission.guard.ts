import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { PermissionService } from './permission.service';

export const permissionGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const permissionService = inject(PermissionService);
  const router = inject(Router);

  const required = route.data?.['requiredCodigoSubMenu'];
  if (!required) return true;

  const allowed = permissionService.hasPermission(required as number | number[]);
  if (allowed) return true;

  return router.createUrlTree(['/acesso-negado']);
};
