import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PermissionService } from './permission.service';
import { AuthService } from './auth.service';

/** Prioridade de rotas para o redirecionamento inicial */
const HOME_ROUTE_MAP: Array<{ codigoSubMenu: number; path: string }> = [
  { codigoSubMenu: 11, path: 'relatorio-dashboard' },
  { codigoSubMenu: 1,  path: 'colaboradores' },
  { codigoSubMenu: 4,  path: 'lista-diarias' },
  { codigoSubMenu: 5,  path: 'diaria-disponivel' },
  { codigoSubMenu: 6,  path: 'cadastro-posto' },
  { codigoSubMenu: 7,  path: 'cadastro-supervisor' },
  { codigoSubMenu: 8,  path: 'cadastro-funcao' },
  { codigoSubMenu: 9,  path: 'cadastro-usuario' },
];

export const homeGuard: CanActivateFn = async () => {
  const permService = inject(PermissionService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.getUserData();

  // Admins têm acesso total — vai direto para o dashboard
  if (user?.tipo === 'A') {
    return router.createUrlTree(['/relatorio-dashboard']);
  }

  // Garante que as permissões estejam carregadas (idempotente)
  await permService.initializeForCurrentUser();

  const first = HOME_ROUTE_MAP.find(r => permService.hasPermission(r.codigoSubMenu));
  return first
    ? router.createUrlTree([`/${first.path}`])
    : router.createUrlTree(['/acesso-negado']);
};
