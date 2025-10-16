import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SeverityEnum } from '../domain/enums/severity-enum';
import { StatusEnum } from '../domain/enums/status-enum';
import { IncidentResponseInterface } from '../domain/interfaces/response/incident-response-interface';

export interface GetIncidentsParams {
  page?: number;
  size?: number;
  serviceName?: string;
  severity?: SeverityEnum;
  status?: StatusEnum;
}

@Injectable({
  providedIn: 'root'
})
export class IncidentService {
  private readonly baseUrl: string = (window as any)['NG_API_DNS'] ?? 'http://localhost:8081';

  constructor(private readonly http: HttpClient) {}

  getIncidents(params?: GetIncidentsParams): Observable<IncidentResponseInterface[]> {
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

    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: token });

    const url = `${this.baseUrl}/api/incidents`;
    return this.http.get<IncidentResponseInterface[]>(url, { params: httpParams, headers });
  }
}
