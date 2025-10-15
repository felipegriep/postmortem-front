import { Inject, Injectable } from '@angular/core';
import { GOOGLE_AUTH_CONFIG, LOGIN_URL } from './auth.tokens';

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
    @Inject(GOOGLE_AUTH_CONFIG) private config: { clientId: string; autoSelect?: boolean; storage?: 'localStorage' | 'sessionStorage' },
    @Inject(LOGIN_URL) private loginUrl: string,
  ) {}

  init(): void {
    if (this.initialized) return;
    // Ensure script is loaded
    if (!window.google || !window.google.accounts || !window.google.accounts.id) {
      console.warn('Google Identity Services not loaded. Add the script to index.html.');
      return;
    }

    window.google.accounts.id.initialize({
      client_id: this.config.clientId,
      auto_select: this.config.autoSelect ?? false,
      callback: (response: any) => this.handleCredentialResponse(response),
    });
    this.initialized = true;
  }

  prompt(): void {
    this.init();
    if (!window.google?.accounts?.id) return;
    window.google.accounts.id.prompt();
  }

  renderButton(target: HTMLElement, options: any = { theme: 'outline', size: 'large' }): void {
    this.init();
    if (!window.google?.accounts?.id) return;
    window.google.accounts.id.renderButton(target, options);
  }

  private handleCredentialResponse(response: { credential: string }): void {
    const jwt = response?.credential;
    if (!jwt) return;
    const storage = (this.config.storage ?? 'localStorage');
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
    try {
      const body = { idToken: jwt, provider: 'Google' };
      fetch(this.loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      }).then(async (res) => {
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          console.warn('Login API returned non-OK status', res.status, text);
          return;
        }
        // Parse response and store backend token if provided
        let data: any = null;
        try {
          data = await res.json();
        } catch {
          data = null;
        }
        const backendToken = data?.token;
        if (backendToken) {
          try {
            if (this.config.storage === 'sessionStorage') {
              sessionStorage.setItem('token', backendToken);
            } else {
              localStorage.setItem('token', backendToken);
            }
          } catch (e) {
            console.error('Failed to store backend token', e);
          }
        }
      }).catch((err) => {
        console.error('Login API request failed', err);
      });
    } catch (e) {
      console.error('Failed to initiate login API request', e);
    }
  }
}
