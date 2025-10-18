import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LoadingComponent } from './shared/loading.component';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, LoadingComponent],
    // Inline template (moved from app.html) so the analyzer sees the usage of <app-loading>
    template: `
    <!-- Um wrapper simples com cor de fundo e modo escuro para a aplicação toda -->
    <main class="bg-gray-100 dark:bg-gray-900 min-h-screen">
        <!-- Loading overlay component (global) -->
        <app-loading></app-loading>

        <!-- O router-outlet é onde os componentes de rota (lista, formulário) serão renderizados -->
        <router-outlet></router-outlet>
    </main>
    `,
    styleUrls: ['./app.scss'],
})
export class AppComponent {
    protected readonly title = signal('postmortem-front');
}
