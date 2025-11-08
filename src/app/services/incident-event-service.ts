import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IncidentEventResponseInterface } from '../domain/interfaces/response/incident-event-response-interface';
import { IncidentEventInterface } from '../domain/interfaces/request/incident-event-interface';
import { HttpUtilsService } from '../shared/http-utils.service';

@Injectable({
    providedIn: 'root',
})
export class IncidentEventService {
    private readonly baseUrl: string;

    constructor(
        private readonly http: HttpClient,
        private readonly httpUtils: HttpUtilsService
    ) {
        this.baseUrl = this.httpUtils.getBaseUrl();
    }

    list(incidentId: number): Observable<IncidentEventResponseInterface[]> {
        const headers = this.httpUtils.getAuthHeaders();
        const url = `${this.baseUrl}/api/incidents/${incidentId}/events`;
        return this.http.get<IncidentEventResponseInterface[]>(url, { headers });
    }

    create(incidentId: number, event: IncidentEventInterface): Observable<void> {
        const headers = this.httpUtils.getAuthHeaders();
        const url = `${this.baseUrl}/api/incidents/${incidentId}/events`;
        return this.http.post<void>(url, event, { headers });
    }

    update(
        incidentId: number,
        id: number,
        incidentEvent: IncidentEventInterface
    ): Observable<IncidentEventResponseInterface> {
        const headers = this.httpUtils.getAuthHeaders();
        const url = `${this.baseUrl}/api/incidents/${incidentId}/events/${id}`;
        return this.http.put<IncidentEventResponseInterface>(url, incidentEvent, { headers });
    }

    delete(incidentId: number, id: number): Observable<void> {
        const headers = this.httpUtils.getAuthHeaders();
        const url = `${this.baseUrl}/api/incidents/${incidentId}/events/${id}`;
        return this.http.delete<void>(url, { headers });
    }
}
