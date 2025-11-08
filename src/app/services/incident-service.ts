import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SeverityEnum } from '../domain/enums/severity-enum';
import { StatusEnum } from '../domain/enums/status-enum';
import { IncidentResponseInterface } from '../domain/interfaces/response/incident-response-interface';
import { IncidentInterface } from '../domain/interfaces/request/incident-interface';
import { PageResponse } from '../domain/interfaces/response/page-response';
import { HttpUtilsService } from '../shared/http-utils.service';

export interface GetIncidentsParams {
    page?: number;
    size?: number;
    serviceName?: string;
    severity?: SeverityEnum | keyof typeof SeverityEnum;
    status?: StatusEnum | keyof typeof StatusEnum;
    sort?: string;
    direction?: 'ASC' | 'DESC';
}

@Injectable({
    providedIn: 'root',
})
export class IncidentService {
    private readonly baseUrl: string;

    constructor(
        private readonly http: HttpClient,
        private readonly httpUtils: HttpUtilsService
    ) {
        this.baseUrl = this.httpUtils.getBaseUrl();
    }

    list(params?: GetIncidentsParams): Observable<PageResponse<IncidentResponseInterface>> {
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
            if (params.sort) {
                httpParams = httpParams.set('sort', params.sort);
            }
            if (params.direction) {
                httpParams = httpParams.set('direction', params.direction);
            }
        }

        const headers = this.httpUtils.getAuthHeaders();

        const url = `${this.baseUrl}/api/incidents`;
        return this.http.get<PageResponse<IncidentResponseInterface>>(url, {
            params: httpParams,
            headers,
        });
    }

    get(id: number): Observable<IncidentResponseInterface> {
        const headers = this.httpUtils.getAuthHeaders();
        const url = `${this.baseUrl}/api/incidents/${id}`;
        return this.http.get<IncidentResponseInterface>(url, { headers });
    }

    create(incident: IncidentInterface): Observable<HttpResponse<any>> {
        const headers = this.httpUtils.getAuthHeaders();
        const url = `${this.baseUrl}/api/incidents`;
        return this.http.post<any>(url, incident, { 
            headers,
            observe: 'response'
        });
    }

    update(id: string, incident: IncidentInterface): Observable<IncidentResponseInterface> {
        const headers = this.httpUtils.getAuthHeaders();
        const url = `${this.baseUrl}/api/incidents/${id}`;
        return this.http.put<IncidentResponseInterface>(url, incident, { headers });
    }

    delete(id: string): Observable<void> {
        const headers = this.httpUtils.getAuthHeaders();
        const url = `${this.baseUrl}/api/incidents/${id}`;
        return this.http.delete<void>(url, { headers });
    }
}
