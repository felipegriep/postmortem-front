import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActionItemInterface } from '../domain/interfaces/request/action-item-interface';
import { ActionItemResponseInterface } from '../domain/interfaces/response/action-item-response-interface';
import { PageResponse } from '../domain/interfaces/response/page-response';
import { ActionStatusEnum } from '../domain/enums/action-status-enum';
import { ActionTypeEnum } from '../domain/enums/action-type-enum';

export interface GetActionItemsParams {
    actionType?: ActionTypeEnum | keyof typeof ActionTypeEnum;
    actionStatus?: ActionStatusEnum | keyof typeof ActionStatusEnum;
    ownerId?: number;
    overdue?: boolean;
    query?: string;
    page?: number;
    size?: number;
    sort?: string;
    direction?: 'ASC' | 'DESC';
}

@Injectable({
    providedIn: 'root',
})
export class ActionItemService {
    private readonly baseUrl: string = (window as any)['NG_API_DNS'] ?? 'http://localhost:8081';

    constructor(private readonly http: HttpClient) {}

    list(
        incidentId: number,
        params?: GetActionItemsParams
    ): Observable<PageResponse<ActionItemResponseInterface>> {
        let httpParams = new HttpParams();

        if (params) {
            if (params.actionType) {
                httpParams = httpParams.set('actionType', params.actionType);
            }
            if (params.actionStatus) {
                httpParams = httpParams.set('actionStatus', params.actionStatus);
            }
            if (params.ownerId !== undefined && params.ownerId !== null) {
                httpParams = httpParams.set('ownerId', String(params.ownerId));
            }
            if (params.overdue !== undefined && params.overdue !== null) {
                httpParams = httpParams.set('overdue', String(params.overdue));
            }
            if (params.query) {
                httpParams = httpParams.set('query', params.query);
            }
            if (params.page !== undefined && params.page !== null) {
                httpParams = httpParams.set('page', String(params.page));
            }
            if (params.size !== undefined && params.size !== null) {
                httpParams = httpParams.set('size', String(params.size));
            }
            if (params.sort) {
                httpParams = httpParams.set('sort', params.sort);
            }
            if (params.direction) {
                httpParams = httpParams.set('direction', params.direction);
            }
        }

        const headers = this.getAuthHeaders();
        const url = `${this.baseUrl}/api/incidents/${incidentId}/actions`;
        return this.http.get<PageResponse<ActionItemResponseInterface>>(url, {
            params: httpParams,
            headers,
        });
    }

    create(incidentId: number, actionItem: ActionItemInterface): Observable<void> {
        const headers = this.getAuthHeaders();
        const url = `${this.baseUrl}/api/incidents/${incidentId}/actions`;
        return this.http.post<void>(url, actionItem, {
            headers,
            responseType: 'text' as 'json',
        });
    }

    update(
        incidentId: number,
        id: number,
        actionItem: ActionItemInterface
    ): Observable<ActionItemResponseInterface> {
        const headers = this.getAuthHeaders();
        const url = `${this.baseUrl}/api/incidents/${incidentId}/actions/${id}`;
        return this.http.put<ActionItemResponseInterface>(url, actionItem, { headers });
    }

    delete(incidentId: number, id: number): Observable<void> {
        const headers = this.getAuthHeaders();
        const url = `${this.baseUrl}/api/incidents/${incidentId}/actions/${id}`;
        return this.http.delete<void>(url, { headers });
    }

    private getAuthHeaders(): HttpHeaders {
        const rawToken = localStorage.getItem('token') || '';
        const token = rawToken && !rawToken.startsWith('Bearer ') ? `Bearer ${rawToken}` : rawToken;
        return new HttpHeaders({ Authorization: token });
    }
}
