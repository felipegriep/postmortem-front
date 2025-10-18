import { Inject, Injectable } from '@angular/core';
import { GOOGLE_AUTH_CONFIG, LOGIN_URL } from './auth.tokens';
import { ProviderEnum } from '../domain/enums/provider-enum';
import { AuthLoginService } from '../services/auth-login.service';
import { GoogleLoaderService } from '../services/google-loader.service';
import { Router } from '@angular/router';

// Type definitions for Google Identity Services
declare global {
    interface Window {
        google?: any;
    }
}

@Injectable({ providedIn: 'root' })
export class GoogleAuthProviderService {
    private initialized = false;

    constructor(
        @Inject(GOOGLE_AUTH_CONFIG)
        private config: {
            clientId: string;
            autoSelect?: boolean;
            storage?: 'localStorage' | 'sessionStorage';
        },
        @Inject(LOGIN_URL) private loginUrl: string,
        private authLoginService: AuthLoginService,
        private googleLoader: GoogleLoaderService,
        private router: Router
    ) {}

    init(): void {
        if (this.initialized) return;
        // Load and initialize Google Identity Services via the dynamic loader
        this.googleLoader
            .init(
                { clientId: this.config.clientId, autoSelect: this.config.autoSelect ?? false },
                (response: any) => this.handleCredentialResponse(response)
            )
            .then(() => {
                this.initialized = true;
            })
            .catch((err) => {
                console.warn('Google Identity Services failed to initialize', err);
            });
    }

    prompt(): void {
        // Ensure initialized and delegate to loader
        this.init();
        this.googleLoader.prompt().catch(() => {
            /* ignore prompt failures */
        });
    }

    renderButton(target: HTMLElement, options: any = { theme: 'outline', size: 'large' }): void {
        // Ensure initialized and delegate to loader
        this.init();
        this.googleLoader.renderButton(target, options).catch(() => {
            /* ignore render failures */
        });
    }

    private async handleCredentialResponse(response: { credential: string }): Promise<void> {
        const jwt = response?.credential;
        if (!jwt) return;
        const storage = this.config.storage ?? 'localStorage';
        try {
            if (storage === 'localStorage') {
                localStorage.setItem('auth_token', jwt);
            } else {
                sessionStorage.setItem('auth_token', jwt);
            }
        } catch (e) {
            console.error('Failed to store auth token', e);
        }

        // Perform backend login POST with parametrized URL
        const body = { idToken: jwt, provider: ProviderEnum.GOOGLE };
        const storageStr = this.config.storage ?? 'localStorage';
        try {
            // Use the Angular service (preferred) to perform login; it exposes a global bridge too
            try {
                await this.authLoginService.performLogin(this.loginUrl, body, storageStr);

                // Notify the rest of the page/app that an auth token arrived so UI can update
                try {
                    window.dispatchEvent(
                        new CustomEvent('auth_token_received', {
                            detail: { provider: ProviderEnum.GOOGLE },
                        })
                    );
                } catch (e) {
                    /* ignore */
                }

                // Hide Google Sign-In UI (if helper exists) and navigate/reload to update menu/UI
                try {
                    if (typeof (window as any).__setGisVisible === 'function') {
                        (window as any).__setGisVisible(false);
                    }
                } catch (e) {
                    /* ignore */
                }

                // Prefer SPA navigation then reload layout to ensure any server-provided state is fetched
                try {
                    // Navigate to root and then reload so layout picks up updated tokens
                    this.router.navigateByUrl('/').finally(() => {
                        try {
                            // small timeout to let navigation settle
                            setTimeout(() => {
                                try {
                                    location.reload();
                                } catch (e) {
                                    /* ignore */
                                }
                            }, 0);
                        } catch (e) {
                            /* ignore */
                        }
                    });
                } catch (e) {
                    try {
                        location.reload();
                    } catch (e2) {
                        /* ignore */
                    }
                }
            } catch (err) {
                console.error('Login API request failed (AuthLoginService)', err);
            }
        } catch (e) {
            console.error('Failed to initiate login API request', e);
        }
    }
}
