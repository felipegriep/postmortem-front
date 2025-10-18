import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SeverityEnum } from '../domain/enums/severity-enum';
import { StatusEnum } from '../domain/enums/status-enum';
import { IncidentResponseInterface } from '../domain/interfaces/response/incident-response-interface';
import { IncidentInterface } from '../domain/interfaces/request/incident-interface';
import { PageResponse } from '../domain/interfaces/response/page-response';

export interface GetIncidentsParams {
    page?: number;
    size?: number;
    serviceName?: string;
    severity?: SeverityEnum;
    status?: StatusEnum;
}

@Injectable({
    providedIn: 'root',
})
export class IncidentService {
    private readonly baseUrl: string = (window as any)['NG_API_DNS'] ?? 'http://localhost:8081';

    constructor(private readonly http: HttpClient) {}

    getIncidents(params?: GetIncidentsParams): Observable<PageResponse<IncidentResponseInterface>> {
        let httpParams = new HttpParams();
        if (params) {
            if (params.page !== undefined && params.page !== null) {
                httpParams = httpParams.set('page', String(params.page));
            }
            if (params.size !== undefined && params.size !== null) {
                httpParams = httpParams.set('size', String(params.size));
            }
            if (params.serviceName) {
                httpParams = httpParams.set('serviceName', params.serviceName);
            }
            if (params.severity) {
                httpParams = httpParams.set('severity', params.severity);
            }
            if (params.status) {
                httpParams = httpParams.set('status', params.status);
            }
        }

        const rawToken = localStorage.getItem('token') || '';
        const token = rawToken && !rawToken.startsWith('Bearer ') ? `Bearer ${rawToken}` : rawToken;
        const headers = new HttpHeaders({ Authorization: token });

        const url = `${this.baseUrl}/api/incidents`;
        return this.http.get<PageResponse<IncidentResponseInterface>>(url, {
            params: httpParams,
            headers,
        });
    }

    getIncidentById(id: number): Observable<IncidentResponseInterface> {
        const rawToken = localStorage.getItem('token') || '';
        const token = rawToken && !rawToken.startsWith('Bearer ') ? `Bearer ${rawToken}` : rawToken;
        const headers = new HttpHeaders({ Authorization: token });
        const url = `${this.baseUrl}/api/incidents/${id}`;
        return this.http.get<IncidentResponseInterface>(url, { headers });
    }

    createIncident(incident: IncidentInterface): Observable<number> {
        const rawToken = localStorage.getItem('token') || '';
        const token = rawToken && !rawToken.startsWith('Bearer ') ? `Bearer ${rawToken}` : rawToken;
        const headers = new HttpHeaders({ Authorization: token });
        const url = `${this.baseUrl}/api/incidents`;
        return this.http.post<number>(url, incident, { headers });
    }

    updateIncident(id: string, incident: IncidentInterface): Observable<IncidentResponseInterface> {
        const rawToken = localStorage.getItem('token') || '';
        const token = rawToken && !rawToken.startsWith('Bearer ') ? `Bearer ${rawToken}` : rawToken;
        const headers = new HttpHeaders({ Authorization: token });
        const url = `${this.baseUrl}/api/incidents/${id}`;
        return this.http.put<IncidentResponseInterface>(url, incident, { headers });
    }

    deleteIncident(id: string): Observable<void> {
        const rawToken = localStorage.getItem('token') || '';
        const token = rawToken && !rawToken.startsWith('Bearer ') ? `Bearer ${rawToken}` : rawToken;
        const headers = new HttpHeaders({ Authorization: token });
        const url = `${this.baseUrl}/api/incidents/${id}`;
        return this.http.delete<void>(url, { headers });
    }
}
