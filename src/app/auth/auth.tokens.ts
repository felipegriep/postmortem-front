import { InjectionToken } from '@angular/core';
import { ProviderEnum } from '../domain/enums/provider-enum';

// Use the ProviderEnum to keep provider values consistent across the app
export type AuthProviderName = ProviderEnum;

export interface GoogleAuthConfig {
    clientId: string;
    autoSelect?: boolean;
    promptParentId?: string; // element id to render prompt button (optional)
    storage?: 'localStorage' | 'sessionStorage';
}

export const AUTH_PROVIDER = new InjectionToken<AuthProviderName>('AUTH_PROVIDER');
export const GOOGLE_AUTH_CONFIG = new InjectionToken<GoogleAuthConfig>('GOOGLE_AUTH_CONFIG');
export const LOGIN_URL = new InjectionToken<string>('LOGIN_URL');
