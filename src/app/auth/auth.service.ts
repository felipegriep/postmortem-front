import { Inject, Injectable } from '@angular/core';
import { AUTH_PROVIDER, AuthProviderName } from './auth.tokens';
import { GoogleAuthProviderService } from './google-auth.provider';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(
    @Inject(AUTH_PROVIDER) private providerName: AuthProviderName,
    private google: GoogleAuthProviderService,
  ) {}

  init(): void {
    switch (this.providerName) {
      case 'Google':
        this.google.init();
        break;
      default:
        console.warn(`Auth provider ${this.providerName} not supported`);
    }
  }

  signIn(): void {
    switch (this.providerName) {
      case 'Google':
        this.google.prompt();
        break;
      default:
        console.warn(`Auth provider ${this.providerName} not supported`);
    }
  }

  renderButton(target: HTMLElement, options?: any): void {
    switch (this.providerName) {
      case 'Google':
        this.google.renderButton(target, options);
        break;
      default:
        console.warn(`Auth provider ${this.providerName} not supported`);
    }
  }
}
