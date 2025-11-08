import { Routes } from '@angular/router';
// Most top-level feature areas still use lazy `loadComponent`, but nested tabs that caused
// chunk-loading issues are referenced directly here to keep navigation stable.
import { LayoutComponent } from './pages/layout-component/layout-component';
import { HomeComponent } from './pages/home-component/home-component';
import { IncidentDetailTabsComponent } from './pages/incident-detail-tabs/incident-detail-tabs.component';
import { IncidentFormComponent } from './pages/incident-form-component/incident-form-component';
import { IncidentTimelineTabComponent } from './pages/incident/incident-timeline-tab/incident-timeline-tab.component';
import { IncidentAnalysisTabComponent } from './pages/incident/incident-analysis-tab/incident-analysis-tab.component';
import { ActionItemTabComponent } from './pages/incident/action-item-tab/action-item-tab';
import { PostmortemDocComponent } from './pages/incident/postmortem-doc-component/postmortem-doc-component';

export const routes: Routes = [
    {
        path: '',
        component: LayoutComponent,
        children: [
            { path: '', component: HomeComponent, pathMatch: 'full' },
            {
                path: 'dashboard',
                loadComponent: () =>
                    import('./pages/dashboard-component/dashboard-component').then(
                        (m) => m.DashboardComponent
                    ),
            },
            {
                path: 'incidents',
                loadComponent: () =>
                    import('./pages/incident-list-component/incident-list-component').then(
                        (m) => m.IncidentListComponent
                    ),
            },
            {
                path: 'incidents/new',
                component: IncidentDetailTabsComponent,
                children: [
                    {
                        path: '',
                        component: IncidentFormComponent,
                    },
                ],
            },
            {
                path: 'incidents/edit/:id',
                component: IncidentDetailTabsComponent,
                children: [
                    {
                        path: '',
                        component: IncidentFormComponent,
                    },
                    {
                        path: 'timeline',
                        component: IncidentTimelineTabComponent,
                    },
                    {
                        path: 'analysis',
                        component: IncidentAnalysisTabComponent,
                    },
                    {
                        path: 'actions',
                        component: ActionItemTabComponent,
                    },
                    {
                        path: 'document',
                        component: PostmortemDocComponent,
                    },
                ],
            },
        ],
    },
    { path: '**', redirectTo: '' }, // Redireciona qualquer outra rota para a home
];
