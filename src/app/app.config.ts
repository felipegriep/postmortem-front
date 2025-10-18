import {ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideHttpClient} from '@angular/common/http';

import {routes} from './app.routes';
import {AUTH_PROVIDER, GOOGLE_AUTH_CONFIG, LOGIN_URL} from './auth/auth.tokens';

export const appConfig: ApplicationConfig = {
    providers: [
        provideBrowserGlobalErrorListeners(),
        provideZoneChangeDetection({eventCoalescing: true}),
        provideRouter(routes),
        provideHttpClient(),
        {provide: AUTH_PROVIDER, useValue: 'google'},
        {
            provide: GOOGLE_AUTH_CONFIG,
            useValue: {
                clientId: (window as any)['NG_GOOGLE_CLIENT_ID'],
                autoSelect: false,
                storage: 'localStorage',
            },
        },
        {provide: LOGIN_URL, useValue: (window as any)['NG_LOGIN_URL']},
    ]
};
