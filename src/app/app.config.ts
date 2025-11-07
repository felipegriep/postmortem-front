import {
    ApplicationConfig,
    provideBrowserGlobalErrorListeners,
    provideZoneChangeDetection,
    APP_INITIALIZER,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';

import { routes } from './app.routes';
import { AUTH_PROVIDER, GOOGLE_AUTH_CONFIG, LOGIN_URL } from './auth/auth.tokens';
import { ProviderEnum } from './domain/enums/provider-enum';
import { AuthLoginService } from './services/auth-login.service';
import { AuthService } from './auth/auth.service';
import { LoadingInterceptor } from './shared/loading.interceptor';
import { ErrorInterceptor } from './shared/error.interceptor';
import { PostmortemDocService } from './services/postmortem-doc-service';

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideAnimations(),
        provideRouter(routes),
        provideHttpClient(withInterceptorsFromDi()),
        // Provide the canonical, capitalized provider value expected by backend
        { provide: AUTH_PROVIDER, useValue: ProviderEnum.GOOGLE },
        {
            provide: GOOGLE_AUTH_CONFIG,
            useValue: {
                // Prefer runtime-injected NG_GOOGLE_CLIENT_ID, otherwise try to read the placeholder data attribute
                clientId:
                    (window as any)['NG_GOOGLE_CLIENT_ID'] ||
                    (typeof document !== 'undefined' && document.getElementById('g_id_onload')
                        ? document.getElementById('g_id_onload')!.getAttribute('data-client_id') ||
                          ''
                        : ''),
                autoSelect: false,
                storage: 'localStorage',
            },
        },
        { provide: LOGIN_URL, useValue: (window as any)['NG_LOGIN_URL'] },
        // Ensure AuthLoginService is instantiated at bootstrap so it can expose a global bridge
        {
            provide: APP_INITIALIZER,
            // `auth` is injected to ensure the service is constructed at app bootstrap.
            // Prefix with `_` to indicate the parameter is intentionally unused and avoid lint warnings.
            useFactory: (_auth: AuthLoginService) => {
                return () => Promise.resolve();
            },
            deps: [AuthLoginService],
            multi: true,
        },
        // Initialize the configured auth provider (e.g. Google) so that SDK is loaded and buttons rendered
        {
            provide: APP_INITIALIZER,
            useFactory: (auth: AuthService) => {
                return () => {
                    try {
                        auth.init();
                    } catch (e) {
                        /* ignore */
                    }
                    return Promise.resolve();
                };
            },
            deps: [AuthService],
            multi: true,
        },
        // Register global interceptors to control loading state and surface errors
        { provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
        { provide: 'PostmortemDocService', useExisting: PostmortemDocService },
    ],
};
