import { Routes } from '@angular/router';
// Incident components will be lazy-loaded via `loadComponent` to keep initial bundle small
// (they import Angular Material and other heavier libs).
import { LayoutComponent } from './pages/layout-component/layout-component';
import { HomeComponent } from './pages/home-component/home-component';

export const routes: Routes = [
    {
        path: '',
        component: LayoutComponent,
        children: [
            { path: '', component: HomeComponent, pathMatch: 'full' },
            {
                path: 'incidents',
                loadComponent: () =>
                    import('./pages/incident-list-component/incident-list-component').then(
                        (m) => m.IncidentListComponent
                    ),
            },
            {
                path: 'incidents/new',
                loadComponent: () =>
                    import('./pages/incident-detail-tabs/incident-detail-tabs.component').then(
                        (m) => m.IncidentDetailTabsComponent
                    ),
                children: [
                    {
                        path: '',
                        loadComponent: () =>
                            import('./pages/incident-form-component/incident-form-component').then(
                                (m) => m.IncidentFormComponent
                            ),
                    },
                ],
            },
            {
                path: 'incidents/edit/:id',
                loadComponent: () =>
                    import('./pages/incident-detail-tabs/incident-detail-tabs.component').then(
                        (m) => m.IncidentDetailTabsComponent
                    ),
                children: [
                    {
                        path: '',
                        loadComponent: () =>
                            import('./pages/incident-form-component/incident-form-component').then(
                                (m) => m.IncidentFormComponent
                            ),
                    },
                    {
                        path: 'timeline',
                        loadComponent: () =>
                            import(
                                './pages/incident/incident-timeline-tab/incident-timeline-tab.component'
                            ).then((m) => m.IncidentTimelineTabComponent),
                    },
                    {
                        path: 'analysis',
                        loadComponent: () =>
                            import(
                                './pages/incident/incident-analysis-tab/incident-analysis-tab.component'
                            ).then((m) => m.IncidentAnalysisTabComponent),
                    },
                    {
                        path: 'actions',
                        loadComponent: () =>
                            import('./pages/incident/action-item-tab/action-item-tab').then(
                                (m) => m.ActionItemTabComponent
                            ),
                    },
                ],
            },
        ],
    },
    { path: '**', redirectTo: '' }, // Redireciona qualquer outra rota para a home
];
