import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RootCauseInterface } from '../domain/interfaces/request/root-cause-interface';
import { RootCauseResponseInterface } from '../domain/interfaces/response/root-cause-response-interface';

@Injectable({
    providedIn: 'root',
})
export class RootCauseService {
    private readonly baseUrl: string = (window as any)['NG_API_DNS'] ?? 'http://localhost:8081';

    constructor(private readonly http: HttpClient) {}

    get(incidentId: number): Observable<RootCauseResponseInterface | null> {
        const rawToken = localStorage.getItem('token') || '';
        const token = rawToken && !rawToken.startsWith('Bearer ') ? `Bearer ${rawToken}` : rawToken;
        const headers = new HttpHeaders({ Authorization: token });
        const url = `${this.baseUrl}/api/incidents/${incidentId}/analysis`;

        return this.http.get<RootCauseResponseInterface | null>(url, { headers });
    }

    create(incidentId: number, payload: RootCauseInterface): Observable<void> {
        const rawToken = localStorage.getItem('token') || '';
        const token = rawToken && !rawToken.startsWith('Bearer ') ? `Bearer ${rawToken}` : rawToken;
        const headers = new HttpHeaders({ Authorization: token });
        const url = `${this.baseUrl}/api/incidents/${incidentId}/analysis`;

        return this.http.post<void>(url, payload, {
            headers,
            responseType: 'text' as 'json',
        });
    }

    update(
        incidentId: number,
        payload: RootCauseInterface
    ): Observable<RootCauseResponseInterface> {
        const rawToken = localStorage.getItem('token') || '';
        const token = rawToken && !rawToken.startsWith('Bearer ') ? `Bearer ${rawToken}` : rawToken;
        const headers = new HttpHeaders({ Authorization: token });
        const url = `${this.baseUrl}/api/incidents/${incidentId}/analysis`;

        return this.http.put<RootCauseResponseInterface>(url, payload, { headers });
    }
}
