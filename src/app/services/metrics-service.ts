import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BucketEnum } from '../domain/enums/bucket-enum';
import { DataFieldEnum } from '../domain/enums/data-field-enum';
import { SeverityEnum } from '../domain/enums/severity-enum';
import { StatusEnum } from '../domain/enums/status-enum';
import { MetricsSummaryResponseInterface } from '../domain/interfaces/response/metrics-summary-response-interface';
import { MetricsSeriesResponseInterface } from '../domain/interfaces/response/metrics-series-response-interface';

export interface GetMetricsSummaryParams {
    from: string; // LocalDate no formato yyyy-MM-dd
    to: string; // LocalDate no formato yyyy-MM-dd
    dateField?: DataFieldEnum;
    severities?: SeverityEnum[];
    statuses?: StatusEnum[];
    includeOpenInMttr?: boolean;
}

export interface GetMetricsSeriesParams {
    from: string; // LocalDate no formato yyyy-MM-dd
    to: string; // LocalDate no formato yyyy-MM-dd
    bucket?: BucketEnum;
    dateField?: DataFieldEnum;
    severities?: SeverityEnum[];
}

@Injectable({
    providedIn: 'root',
})
export class MetricsService {
    private readonly baseUrl: string = (window as any)['NG_API_DNS'] ?? 'http://localhost:8081';

    constructor(private readonly http: HttpClient) {}

    private getHeaders(): HttpHeaders {
        const rawToken = localStorage.getItem('token') || '';
        const token = rawToken && !rawToken.startsWith('Bearer ') ? `Bearer ${rawToken}` : rawToken;
        return new HttpHeaders({ Authorization: token });
    }

    summary(params: GetMetricsSummaryParams): Observable<MetricsSummaryResponseInterface> {
        let httpParams = new HttpParams()
            .set('from', params.from)
            .set('to', params.to);

        if (params.dateField) {
            httpParams = httpParams.set('dateField', params.dateField);
        }

        if (params.severities && params.severities.length > 0) {
            params.severities.forEach(severity => {
                httpParams = httpParams.append('severities', severity);
            });
        }

        if (params.statuses && params.statuses.length > 0) {
            params.statuses.forEach(status => {
                httpParams = httpParams.append('statuses', status);
            });
        }

        if (params.includeOpenInMttr !== undefined) {
            httpParams = httpParams.set('includeOpenInMttr', String(params.includeOpenInMttr));
        }

        const url = `${this.baseUrl}/api/metrics/summary`;
        return this.http.get<MetricsSummaryResponseInterface>(url, {
            params: httpParams,
            headers: this.getHeaders(),
        });
    }

    series(params: GetMetricsSeriesParams): Observable<MetricsSeriesResponseInterface> {
        let httpParams = new HttpParams()
            .set('from', params.from)
            .set('to', params.to);

        if (params.bucket) {
            httpParams = httpParams.set('bucket', params.bucket);
        }

        if (params.dateField) {
            httpParams = httpParams.set('dateField', params.dateField);
        }

        if (params.severities && params.severities.length > 0) {
            params.severities.forEach(severity => {
                httpParams = httpParams.append('severities', severity);
            });
        }

        const url = `${this.baseUrl}/api/metrics/series`;
        return this.http.get<MetricsSeriesResponseInterface>(url, {
            params: httpParams,
            headers: this.getHeaders(),
        });
    }
}
