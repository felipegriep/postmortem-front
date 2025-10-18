import { Injectable } from '@angular/core';

export interface GoogleLoaderConfig {
    clientId: string;
    autoSelect?: boolean;
}

@Injectable({ providedIn: 'root' })
export class GoogleLoaderService {
    private loaded = false;
    private initializing: Promise<void> | null = null;

    private waitForAccounts(): Promise<void> {
        return new Promise((resolve, reject) => {
            const max = 10000; // ms (increased timeout to allow slower networks)
            const interval = 50;
            let waited = 0;
            const tick = () => {
                const w = window as any;
                if (w.google && w.google.accounts && w.google.accounts.id) {
                    resolve();
                } else {
                    waited += interval;
                    if (waited >= max) {
                        reject(
                            new Error('Google Identity Services did not become available in time')
                        );
                    } else {
                        setTimeout(tick, interval);
                    }
                }
            };
            tick();
        });
    }

    loadScript(): Promise<void> {
        if (this.loaded) return Promise.resolve();
        if (this.initializing) return this.initializing;

        this.initializing = new Promise((resolve, reject) => {
            const existing = document.querySelector('script[data-gsi-loader]');
            if (existing) {
                // If script tag exists, wait for accounts to be ready
                this.waitForAccounts()
                    .then(() => {
                        this.loaded = true;
                        this.initializing = null;
                        resolve();
                    })
                    .catch((err) => {
                        this.initializing = null;
                        reject(err);
                    });
                return;
            }

            const script = document.createElement('script');
            script.async = true;
            script.defer = true;
            script.src = 'https://accounts.google.com/gsi/client';
            script.setAttribute('data-gsi-loader', 'true');
            script.onload = () => {
                this.waitForAccounts()
                    .then(() => {
                        this.loaded = true;
                        this.initializing = null;
                        resolve();
                    })
                    .catch((err) => {
                        this.initializing = null;
                        reject(err);
                    });
            };
            script.onerror = (_ev) => {
                this.initializing = null;
                reject(new Error('Failed to load Google Identity Services script'));
            };
            document.head.appendChild(script);
        });

        return this.initializing;
    }

    async init(config: GoogleLoaderConfig, callback: (resp: any) => void): Promise<void> {
        console.log('GoogleLoaderService.init called with clientId:', config?.clientId);
        if (!config?.clientId) {
            console.warn(
                'GoogleLoaderService: missing clientId; button will not work without a valid client id'
            );
        }
        await this.loadScript();
        const w = window as any;
        if (!w.google || !w.google.accounts || !w.google.accounts.id) {
            throw new Error('Google Identity Services not available after script load');
        }
        console.log(
            'Google Identity Services available, initializing with clientId:',
            config.clientId
        );
        w.google.accounts.id.initialize({
            client_id: config.clientId,
            auto_select: config.autoSelect ?? false,
            callback,
        });

        // Auto-render any existing placeholder elements inserted in index.html
        try {
            const btnEls = document.getElementsByClassName('g_id_signin');
            console.log(
                'GoogleLoaderService: found',
                btnEls.length,
                'g_id_signin elements to render'
            );
            for (let i = 0; i < btnEls.length; i++) {
                try {
                    w.google.accounts.id.renderButton(btnEls[i], {
                        theme: 'outline',
                        size: 'large',
                    });
                } catch (e) {
                    // ignore render errors
                }
            }

            // If a data-auto_prompt element exists (previously used in index.html), trigger prompt
            const onloadEl = document.querySelector('[data-auto_prompt="true"]');
            console.log('GoogleLoaderService: auto_prompt element present?', !!onloadEl);
            if (onloadEl) {
                try {
                    if (typeof w.google.accounts.id.prompt === 'function') {
                        w.google.accounts.id.prompt();
                    }
                } catch (e) {
                    // ignore
                }
            }
        } catch (e) {
            // ignore auto-render issues
        }
    }

    async prompt(): Promise<void> {
        await this.loadScript();
        const w = window as any;
        if (
            w.google &&
            w.google.accounts &&
            w.google.accounts.id &&
            typeof w.google.accounts.id.prompt === 'function'
        ) {
            w.google.accounts.id.prompt();
        }
    }

    async renderButton(
        target: HTMLElement,
        options: any = { theme: 'outline', size: 'large' }
    ): Promise<void> {
        await this.loadScript();
        const w = window as any;
        if (
            w.google &&
            w.google.accounts &&
            w.google.accounts.id &&
            typeof w.google.accounts.id.renderButton === 'function'
        ) {
            w.google.accounts.id.renderButton(target, options);
        }
    }
}
