import { Injectable } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';

/**
 * Serviço utilitário para operações HTTP comuns
 */
@Injectable({
    providedIn: 'root'
})
export class HttpUtilsService {
    /**
     * Retorna headers HTTP com token de autorização do localStorage
     * @returns HttpHeaders com Authorization header configurado
     */
    getAuthHeaders(): HttpHeaders {
        const rawToken = localStorage.getItem('token') || '';
        const token = rawToken && !rawToken.startsWith('Bearer ') 
            ? `Bearer ${rawToken}` 
            : rawToken;
        return new HttpHeaders({ Authorization: token });
    }

    /**
     * Retorna a URL base da API configurada
     * @returns URL base da API
     */
    getBaseUrl(): string {
        return (window as any)['NG_API_DNS'] ?? 'http://localhost:8081';
    }
}
