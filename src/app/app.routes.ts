import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Collaborators } from './collaborators/collaborators';
import { AddDi } from './dailies/add-di/add-di';
import { AddSingleDi } from './dailies/add-single-di/add-single-di';
import { DailiesList } from './dailies/dailies-list/dailies-list';
import { StationRegistration } from './registration/station-registration/station-registration';
import { MainLayoutComponent } from './layout/main-layout/main-layout';

export const routes: Routes = [
  { path: 'login', component: Login },
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', redirectTo: 'colaboradores', pathMatch: 'full' }, 
      { path: 'colaboradores', component: Collaborators },
      { path: 'adicionar-diaria', component: AddDi },
      { path: 'adicionar-unica-diaria', component: AddSingleDi },
      { path: 'lista-diarias', component: DailiesList },
      { path: 'cadastro-posto', component: StationRegistration }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
