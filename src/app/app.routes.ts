import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Collaborators } from './collaborators/collaborators';
import { AddCollaboratorPage } from './collaborators/add-collaborator-page/add-collaborator-page';
import { AddDi } from './dailies/add-di/add-di';
import { AddSingleDi } from './dailies/add-single-di/add-single-di';
import { DailiesList } from './dailies/dailies-list/dailies-list';
import { StationRegistration } from './registration/station-registration/station-registration';
import { SupervisorRegistration } from './registration/supervisor-registration/supervisor-registration';
import { RoleRegistration } from './registration/role-registration/role-registration';
import { UserRegistration } from './registration/user-registration/user-registration';
import { Dashboard } from './reports/dashboard/dashboard';
import { CurriculumsList } from './reports/curriculums-list/curriculums-list';
import { DailiesReport } from './reports/dailies-report/dailies-report';
import { ConsolidatedReport } from './reports/consolidated-report/consolidated-report';
import { ConsolidatedByDateReport } from './reports/consolidated-by-date-report/consolidated-by-date-report';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: MainLayoutComponent,
    canActivateChild: [authGuard],
    children: [
      { path: '', redirectTo: 'colaboradores', pathMatch: 'full' }, 
      { path: 'colaboradores', component: Collaborators },
      { path: 'colaboradores/novo', component: AddCollaboratorPage },
      { path: 'adicionar-diaria', component: AddDi },
      { path: 'adicionar-unica-diaria', component: AddSingleDi },
      { path: 'lista-diarias', component: DailiesList },
      { path: 'cadastro-posto', component: StationRegistration },
      { path: 'cadastro-supervisor', component: SupervisorRegistration },
      { path: 'cadastro-funcao', component: RoleRegistration },
      { path: 'cadastro-usuario', component: UserRegistration },
      { path: 'relatorio-dashboard', component: Dashboard },
      { path: 'relatorio-curriculos', component: CurriculumsList },
      { path: 'relatorio-diarias', component: DailiesReport },
      { path: 'relatorio-consolidado', component: ConsolidatedReport },
      { path: 'relatorio-consolidado-data', component: ConsolidatedByDateReport }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
