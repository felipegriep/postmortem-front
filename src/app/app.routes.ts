import {Routes} from '@angular/router';
import {IncidentListComponent} from './pages/incident-list-component/incident-list-component';
import {IncidentFormComponent} from './pages/incident-form-component/incident-form-component';
import {LayoutComponent} from './pages/layout-component/layout-component';
import {HomeComponent} from './pages/home-component/home-component';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: HomeComponent, pathMatch: 'full' },
      { path: 'incidents', component: IncidentListComponent },
      { path: 'incidents/new', component: IncidentFormComponent },
      { path: 'incidents/edit/:id', component: IncidentFormComponent },
    ]
  },
  { path: '**', redirectTo: '' } // Redireciona qualquer outra rota para a home
];
