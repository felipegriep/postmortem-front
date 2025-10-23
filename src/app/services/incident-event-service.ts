import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IncidentEventResponseInterface } from '../domain/interfaces/response/incident-event-response-interface';
import { IncidentEventInterface } from '../domain/interfaces/request/incident-event-interface';

@Injectable({
    providedIn: 'root',
})
export class IncidentEventService {
    private readonly baseUrl: string = (window as any)['NG_API_DNS'] ?? 'http://localhost:8081';

    constructor(private readonly http: HttpClient) {}

    list(incidentId: number): Observable<IncidentEventResponseInterface[]> {
        const rawToken = localStorage.getItem('token') || '';
        const token = rawToken && !rawToken.startsWith('Bearer ') ? `Bearer ${rawToken}` : rawToken;
        const headers = new HttpHeaders({ Authorization: token });

        const url = `${this.baseUrl}/api/incidents/${incidentId}/events`;
        return this.http.get<IncidentEventResponseInterface[]>(url, { headers });
    }

    create(incidentId: number, event: IncidentEventInterface): Observable<void> {
        const rawToken = localStorage.getItem('token') || '';
        const token = rawToken && !rawToken.startsWith('Bearer ') ? `Bearer ${rawToken}` : rawToken;
        const headers = new HttpHeaders({ Authorization: token });

        const url = `${this.baseUrl}/api/incidents/${incidentId}/events`;
        return this.http.post<void>(url, event, { headers });
    }

    update(
        incidentId: number,
        id: number,
        incidentEvent: IncidentEventInterface
    ): Observable<IncidentEventResponseInterface> {
        const rawToken = localStorage.getItem('token') || '';
        const token = rawToken && !rawToken.startsWith('Bearer ') ? `Bearer ${rawToken}` : rawToken;
        const headers = new HttpHeaders({ Authorization: token });

        const url = `${this.baseUrl}/api/incidents/${incidentId}/events/${id}`;
        return this.http.put<IncidentEventResponseInterface>(url, incidentEvent, { headers });
    }

    delete(incidentId: number, id: number): Observable<void> {
        const rawToken = localStorage.getItem('token') || '';
        const token = rawToken && !rawToken.startsWith('Bearer ') ? `Bearer ${rawToken}` : rawToken;
        const headers = new HttpHeaders({ Authorization: token });

        const url = `${this.baseUrl}/api/incidents/${incidentId}/events/${id}`;
        return this.http.delete<void>(url, { headers });
    }
}
