import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RootCauseInterface } from '../domain/interfaces/request/root-cause-interface';
import { RootCauseResponseInterface } from '../domain/interfaces/response/root-cause-response-interface';
import { HttpUtilsService } from '../shared/http-utils.service';

@Injectable({
    providedIn: 'root',
})
export class RootCauseService {
    private readonly baseUrl: string;

    constructor(
        private readonly http: HttpClient,
        private readonly httpUtils: HttpUtilsService
    ) {
        this.baseUrl = this.httpUtils.getBaseUrl();
    }

    get(incidentId: number): Observable<RootCauseResponseInterface | null> {
        const headers = this.httpUtils.getAuthHeaders();
        const url = `${this.baseUrl}/api/incidents/${incidentId}/analysis`;
        return this.http.get<RootCauseResponseInterface | null>(url, { headers });
    }

    create(incidentId: number, payload: RootCauseInterface): Observable<void> {
        const headers = this.httpUtils.getAuthHeaders();
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
        const headers = this.httpUtils.getAuthHeaders();
        const url = `${this.baseUrl}/api/incidents/${incidentId}/analysis`;
        return this.http.put<RootCauseResponseInterface>(url, payload, { headers });
    }
}
