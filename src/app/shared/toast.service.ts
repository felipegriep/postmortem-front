import { Injectable, inject } from '@angular/core';
import {
    MatSnackBar,
    MatSnackBarConfig,
    MatSnackBarHorizontalPosition,
    MatSnackBarVerticalPosition,
} from '@angular/material/snack-bar';

export type ToastKind = 'success' | 'error' | 'info' | 'warning';

export interface ToastOptions {
    kind?: ToastKind;
    durationMs?: number | null;
    action?: string | null;
    horizontalPosition?: MatSnackBarHorizontalPosition;
    verticalPosition?: MatSnackBarVerticalPosition;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
    private readonly snackBar = inject(MatSnackBar);

    show(message: string, options: ToastOptions = {}): void {
        const {
            kind = 'info',
            durationMs = 4000,
            action = 'Fechar',
            horizontalPosition = 'end',
            verticalPosition = 'top',
        } = options;

        const config: MatSnackBarConfig = {
            duration: durationMs ?? undefined,
            panelClass: [`toast-${kind}`],
            horizontalPosition,
            verticalPosition,
        };

        this.snackBar.open(message, action ?? undefined, config);
    }

    success(message: string, durationMs?: number): void {
        this.show(message, { kind: 'success', durationMs });
    }

    error(message: string, durationMs?: number): void {
        this.show(message, { kind: 'error', durationMs });
    }

    info(message: string, durationMs?: number): void {
        this.show(message, { kind: 'info', durationMs });
    }

    warning(message: string, durationMs?: number): void {
        this.show(message, { kind: 'warning', durationMs });
    }
}
