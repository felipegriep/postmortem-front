import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
    private _authListener = () => {
        try {
            this.cdr.detectChanges();
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
    }

    ngOnDestroy(): void {
        try {
            window.removeEventListener('auth_token_received', this._authListener);
        } catch {
            // ignore
        }
    }

    get isLoggedIn(): boolean {
        try {
            return !!(localStorage.getItem('token') || sessionStorage.getItem('token'));
        } catch {
            return false;
        }
    }

    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
    }

    closeMenu() {
        this.isMenuOpen = false;
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
}
