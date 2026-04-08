import { Routes } from '@angular/router';
import { authGuard } from './services/auth.guard';
import { adminGuard } from './services/admin.guard';
import { permissionGuard } from './services/permission.guard';
import { homeGuard } from './services/home.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./login/login').then(m => m.Login)
  },
  {
    path: 'acesso-negado',
    loadComponent: () => import('./access-denied/access-denied').then(m => m.AccessDeniedComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layout/main-layout/main-layout').then(m => m.MainLayoutComponent),
    canActivateChild: [authGuard],
    children: [
      { path: '', canActivate: [homeGuard], children: [] },
      { path: 'colaboradores', loadComponent: () => import('./collaborators/collaborators').then(m => m.Collaborators) },
      { path: 'colaboradores/novo', loadComponent: () => import('./collaborators/add-collaborator-page/add-collaborator-page').then(m => m.AddCollaboratorPage) },
      { path: 'colaboradores/:id/editar', loadComponent: () => import('./collaborators/add-collaborator-page/add-collaborator-page').then(m => m.AddCollaboratorPage) },
      { path: 'adicionar-diaria', loadComponent: () => import('./dailies/add-di/add-di').then(m => m.AddDi) },
      { path: 'adicionar-unica-diaria', loadComponent: () => import('./dailies/add-single-di/add-single-di').then(m => m.AddSingleDi) },
      { path: 'lista-diarias', loadComponent: () => import('./dailies/dailies-list/dailies-list').then(m => m.DailiesList) },
      { path: 'diaria-disponivel', loadComponent: () => import('./dailies/diaria-disponivel/diaria-disponivel').then(m => m.DiariaDisponivelComponent) },
      { path: 'cadastro-posto', loadComponent: () => import('./registration/station-registration/station-registration').then(m => m.StationRegistration) },
      { path: 'cadastro-supervisor', loadComponent: () => import('./registration/supervisor-registration/supervisor-registration').then(m => m.SupervisorRegistration) },
      { path: 'cadastro-funcao', loadComponent: () => import('./registration/role-registration/role-registration').then(m => m.RoleRegistration) },
      { path: 'cadastro-usuario', canActivate: [adminGuard], loadComponent: () => import('./registration/user-registration/user-registration').then(m => m.UserRegistration) },
      {
        path: 'controle-acesso',
        canActivate: [adminGuard],
        loadComponent: () => import('./permissions/user-permissions/user-permissions').then(m => m.UserPermissionsComponent)
      },
      {
        path: 'gestao-permissoes',
        canActivate: [adminGuard],
        loadComponent: () => import('./permissions/user-permissions/user-permissions').then(m => m.UserPermissionsComponent)
      },
      { path: 'relatorio-dashboard', canActivate: [permissionGuard], data: { requiredCodigoSubMenu: 11 }, loadComponent: () => import('./reports/dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'relatorio-curriculos', loadComponent: () => import('./reports/curriculums-list/curriculums-list').then(m => m.CurriculumsList) },
      { path: 'relatorio-diarias', loadComponent: () => import('./reports/dailies-report/dailies-report').then(m => m.DailiesReport) },
      { path: 'relatorio-consolidado', loadComponent: () => import('./reports/consolidated-report/consolidated-report').then(m => m.ConsolidatedReport) },
      { path: 'relatorio-consolidado-data', loadComponent: () => import('./reports/consolidated-by-date-report/consolidated-by-date-report').then(m => m.ConsolidatedByDateReport) },
      { path: 'aprovacoes/pendentes', canActivate: [adminGuard], loadComponent: () => import('./aprovacoes/aprovacoes-pendentes/aprovacoes-pendentes').then(m => m.AprovacoesPendentesComponent) },
      { path: 'aprovacoes/minhas', loadComponent: () => import('./aprovacoes/minhas-solicitacoes/minhas-solicitacoes').then(m => m.MinhasSolicitacoesComponent) },
      { path: 'aprovacoes/configurar', canActivate: [adminGuard], loadComponent: () => import('./aprovacoes/configurar-liberacao/configurar-liberacao').then(m => m.ConfigurarLiberacaoComponent) }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
