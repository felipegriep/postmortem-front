import {Component} from '@angular/core';
import {Router, RouterModule} from '@angular/router';
import {CommonModule} from '@angular/common';

@Component({
    selector: 'app-layout-component',
    standalone: true,
    imports: [RouterModule, CommonModule],
    templateUrl: './layout-component.html',
    styleUrl: './layout-component.scss'
})
export class LayoutComponent {
    isMenuOpen = false;

    constructor(private router: Router) {
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
            } catch {
            }
        }

        // Fallback: clear local/session tokens
        try {
            localStorage.removeItem('token');
        } catch {
        }
        try {
            localStorage.removeItem('auth_token');
        } catch {
        }
        try {
            sessionStorage.removeItem('token');
        } catch {
        }
        try {
            sessionStorage.removeItem('auth_token');
        } catch {
        }

        // Notify any listeners (index.html toggles GIS UI)
        try {
            window.dispatchEvent(new CustomEvent('app_logout'));
        } catch {
        }

        // Navigate home and reload layout
        this.router.navigateByUrl('/')
            .then(() => {
                location.reload();
            })
            .catch(() => {
                location.reload();
            });
    }
}
