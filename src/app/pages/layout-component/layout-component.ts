import {
    Component,
    OnInit,
    OnDestroy,
    ChangeDetectorRef,
    ElementRef,
    ViewChild,
} from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-layout-component',
    standalone: true,
    imports: [RouterModule, CommonModule],
    templateUrl: './layout-component.html',
    styleUrls: ['./layout-component.scss'],
})
export class LayoutComponent implements OnInit, OnDestroy {
    isMenuOpen = false;

    // user object decoded from auth token (if present). Contains at least `picture`, `name`, `email` when available.
    user: { picture?: string; name?: string; email?: string } | null = null;

    @ViewChild('hamburgerBtn', { static: false }) hamburgerBtn?: ElementRef<HTMLButtonElement>;
    @ViewChild('sidebar', { static: false }) sidebar?: ElementRef<HTMLElement>;

    private _authListener = () => {
        try {
            this.setUserFromStorage();
            this.cdr.detectChanges();
        } catch {
            // ignore
        }
    };

    private _storageListener = (ev: StorageEvent) => {
        try {
            if (!ev) return;
            if (ev.key === 'auth_token' || ev.key === 'token') {
                this.setUserFromStorage();
                this.cdr.detectChanges();
            }
        } catch {
            // ignore
        }
    };

    private _keydownListener = (ev: KeyboardEvent) => {
        try {
            if (!this.isMenuOpen) return;
            if (ev.key === 'Escape' || ev.key === 'Esc') {
                ev.preventDefault();
                this.closeMenu();
                return;
            }
            if (ev.key === 'Tab') {
                this._trapFocus(ev);
            }
        } catch {
            // ignore
        }
    };

    constructor(private router: Router, private cdr: ChangeDetectorRef) {}

    ngOnInit(): void {
        try {
            window.addEventListener('auth_token_received', this._authListener);
        } catch {
            // ignore
        }
        try {
            window.addEventListener('storage', this._storageListener);
        } catch {
            // ignore
        }
        try {
            window.addEventListener('keydown', this._keydownListener);
        } catch {
            // ignore
        }

        // initialize user from any existing token
        this.setUserFromStorage();
    }

    ngOnDestroy(): void {
        try {
            window.removeEventListener('auth_token_received', this._authListener);
        } catch {
            // ignore
        }
        try {
            window.removeEventListener('storage', this._storageListener as any);
        } catch {
            // ignore
        }
        try {
            window.removeEventListener('keydown', this._keydownListener as any);
        } catch {
            // ignore
        }
    }

    get isLoggedIn(): boolean {
        try {
            // consider both backend token and Google id token
            return !!(
                localStorage.getItem('token') ||
                sessionStorage.getItem('token') ||
                localStorage.getItem('auth_token') ||
                sessionStorage.getItem('auth_token')
            );
        } catch {
            return false;
        }
    }

    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
        this.cdr.detectChanges();
        if (this.isMenuOpen) {
            // Allow DOM to render then move focus into sidebar
            setTimeout(() => this._focusFirstElementInSidebar(), 50);
        } else {
            // restore focus to hamburger
            setTimeout(() => this.hamburgerBtn?.nativeElement?.focus(), 50);
        }
    }

    closeMenu() {
        this.isMenuOpen = false;
        this.cdr.detectChanges();
        // restore focus back to hamburger to preserve keyboard flow
        setTimeout(() => this.hamburgerBtn?.nativeElement?.focus(), 50);
    }

    logout(evt?: Event) {
        if (evt) evt.preventDefault();
        this.closeMenu();

        // Attempt Google logout if GIS is available
        const w = window as any;
        if (typeof w.googleLogout === 'function') {
            try {
                w.googleLogout();
            } catch {}
        }

        // Fallback: clear local/session tokens
        try {
            localStorage.removeItem('token');
        } catch {}
        try {
            localStorage.removeItem('auth_token');
        } catch {}
        try {
            sessionStorage.removeItem('token');
        } catch {}
        try {
            sessionStorage.removeItem('auth_token');
        } catch {}

        // Clear local user object
        this.user = null;

        // Notify any listeners (index.html toggles GIS UI)
        try {
            window.dispatchEvent(new CustomEvent('app_logout'));
        } catch {}

        // Navigate home and reload layout
        this.router
            .navigateByUrl('/')
            .then(() => {
                location.reload();
            })
            .catch(() => {
                location.reload();
            });
    }

    private setUserFromStorage() {
        try {
            const token =
                localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
            if (!token) {
                this.user = null;
                return;
            }
            const payload = this.decodeJwtPayload(token);
            if (payload) {
                this.user = {
                    picture: payload.picture || payload.photoUrl || payload.avatar || undefined,
                    name: payload.name || payload.given_name || payload.family_name || undefined,
                    email: payload.email || undefined,
                };
            } else {
                this.user = null;
            }
        } catch (e) {
            this.user = null;
        }
    }

    private decodeJwtPayload(token: string): any | null {
        try {
            const parts = token.split('.');
            if (parts.length < 2) return null;
            const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            const json = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                    .join('')
            );
            return JSON.parse(json);
        } catch {
            return null;
        }
    }

    private _focusFirstElementInSidebar() {
        try {
            const el = this.sidebar?.nativeElement;
            if (!el) return;
            const focusable = el.querySelectorAll<HTMLElement>(
                'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
            );
            if (focusable && focusable.length) {
                focusable[0].focus();
            } else {
                el.focus();
            }
        } catch {
            // ignore
        }
    }

    private _trapFocus(ev: KeyboardEvent) {
        try {
            const el = this.sidebar?.nativeElement;
            if (!el) return;
            const nodes = Array.from(
                el.querySelectorAll<HTMLElement>(
                    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
                )
            ).filter((n) => !!(n.offsetWidth || n.offsetHeight || n.getClientRects().length));
            if (!nodes.length) return;
            const first = nodes[0];
            const last = nodes[nodes.length - 1];
            const active = document.activeElement as HTMLElement | null;
            if (ev.shiftKey) {
                if (active === first || active === el) {
                    ev.preventDefault();
                    last.focus();
                }
            } else {
                if (active === last) {
                    ev.preventDefault();
                    first.focus();
                }
            }
        } catch {
            // ignore
        }
    }

    // Return initials (1–2 letters) from a full name or email fallback.
    getInitials(nameOrEmail?: string | null): string {
        try {
            if (!nameOrEmail) return '';
            const s = nameOrEmail.trim();
            if (!s) return '';
            // If it looks like an email use the part before '@'
            const beforeAt = s.includes('@') ? s.split('@')[0] : s;
            const parts = beforeAt.split(/\s+/).filter(Boolean);
            if (parts.length === 0) return '';
            if (parts.length === 1) {
                // single word: take first two letters
                return parts[0].substring(0, 2).toUpperCase();
            }
            // multiple words: take first letter of first and last
            const first = parts[0][0] || '';
            const last = parts[parts.length - 1][0] || '';
            return (first + last).slice(0, 2).toUpperCase();
        } catch {
            return '';
        }
    }
}
