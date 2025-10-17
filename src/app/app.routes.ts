import {Routes} from '@angular/router';
import {IncidentListComponent} from './pages/incident-list-component/incident-list-component';
import {IncidentFormComponent} from './pages/incident-form-component/incident-form-component';

export const routes: Routes = [
  { path: 'incidents', component: IncidentListComponent },
  { path: 'incidents/new', component: IncidentFormComponent },
  { path: 'incidents/edit/:id', component: IncidentFormComponent },
  { path: '', redirectTo: '/incidents', pathMatch: 'full' },
  { path: '**', redirectTo: '/incidents' } // Rota curinga
];
