import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app.routes';
import { AUTH_PROVIDER, GOOGLE_AUTH_CONFIG, LOGIN_URL } from './auth/auth.tokens';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(),
    { provide: AUTH_PROVIDER, useValue: 'google' },
    {
      provide: GOOGLE_AUTH_CONFIG,
      useValue: {
        clientId: (window as any)['NG_GOOGLE_CLIENT_ID'] ?? '585748395907-a7vn1014fncm3mgnra5gmtoo04rf01d5.apps.googleusercontent.com',
        autoSelect: false,
        storage: 'localStorage',
      },
    },
    { provide: LOGIN_URL, useValue: (window as any)['NG_LOGIN_URL'] ?? 'http://localhost:8081/auth/login' },
  ]
};
