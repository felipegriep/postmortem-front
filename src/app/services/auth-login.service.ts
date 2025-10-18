import { Injectable, Inject } from '@angular/core';
import { LOGIN_URL } from '../auth/auth.tokens';

@Injectable({ providedIn: 'root' })
export class AuthLoginService {
    constructor(@Inject(LOGIN_URL) private loginUrl: string) {
        // Expose a bridge so legacy inline scripts can call into Angular once the service is created
        try {
            // If there's no global performLogin, expose Angular implementation.
            // If a queue-stub exists (created by auth-login.js), flush it using __flush and replace with Angular implementation.
            const w = window as any;
            const bound = this.performLogin.bind(this);
            if (!w.performLogin) {
                w.performLogin = bound;
            } else if (
                w.performLogin &&
                w.performLogin.__isQueueStub &&
                typeof w.performLogin.__flush === 'function'
            ) {
                try {
                    // Flush queued calls to the real implementation
                    w.performLogin.__flush(bound);
                } catch (e) {
                    // ignore flush errors
                }
                // Replace stub with the real implementation
                w.performLogin = bound;
            } else {
                // If another implementation exists, expose Angular implementation as ngPerformLogin
                w.ngPerformLogin = bound;
            }
        } catch (e) {
            // ignore
        }
    }

    async performLogin(
        loginUrl: string | undefined,
        body: any,
        storage: 'localStorage' | 'sessionStorage' = 'localStorage'
    ) {
        const url =
            loginUrl ||
            this.loginUrl ||
            (window as any).NG_LOGIN_URL ||
            'http://localhost:8081/auth/login';
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                credentials: 'include',
            });
            if (!res.ok) {
                let text = '';
                try {
                    text = await res.text();
                } catch {
                    // ignore
                }
                console.warn('Login API returned non-OK status', res.status, text);
                return;
            }

            try {
                const data = await res.json();
                const backendToken = data && data.token;
                if (backendToken) {
                    try {
                        if (storage === 'sessionStorage') {
                            sessionStorage.setItem('token', backendToken);
                        } else {
                            localStorage.setItem('token', backendToken);
                        }
                    } catch (e) {
                        console.error('Failed to store backend token', e);
                    }
                }
            } catch (e) {
                // ignore non-json
            }
        } catch (err) {
            console.error('Login API request failed (AuthLoginService)', err);
        }
    }
}
