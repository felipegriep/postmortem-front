import { Injectable } from '@angular/core';
import {
    HttpErrorResponse,
    HttpEvent,
    HttpHandler,
    HttpInterceptor,
    HttpRequest,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ToastService } from './toast.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
    constructor(private readonly toast: ToastService) {}

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(req).pipe(
            catchError((error: unknown) => {
                if (error instanceof HttpErrorResponse) {
                    this.toast.error(this.extractMessage(error));
                } else {
                    this.toast.error('Ocorreu um erro inesperado.');
                }
                return throwError(() => error);
            })
        );
    }

    private extractMessage(error: HttpErrorResponse): string {
        if (!navigator.onLine) {
            return 'Sem conexão. Verifique sua internet e tente novamente.';
        }
        if (error.status === 0) {
            return 'Não foi possível se conectar ao servidor.';
        }

        const payload = error.error;
        if (typeof payload === 'string' && payload.trim()) {
            return payload;
        }
        if (payload && typeof payload === 'object') {
            if (typeof payload.message === 'string' && payload.message.trim()) {
                return payload.message;
            }
            const validationErrors = payload.errors;
            if (validationErrors && typeof validationErrors === 'object') {
                const firstKey = Object.keys(validationErrors)[0];
                if (firstKey) {
                    const detail = validationErrors[firstKey];
                    if (Array.isArray(detail) && detail.length) {
                        return String(detail[0]);
                    }
                    if (typeof detail === 'string') {
                        return detail;
                    }
                }
            }
        }

        return 'Ocorreu um erro ao processar sua solicitação.';
    }
}
