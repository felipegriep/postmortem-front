import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PostmortemDocResponseInterface } from '../domain/interfaces/response/postmortem-doc-response-interface';
import { DocFormatEnum } from '../domain/enums/doc-format-enum';
import { DocDispositionEnum } from '../domain/enums/doc-disposition-enum';
import { HttpUtilsService } from '../shared/http-utils.service';

@Injectable({
  providedIn: 'root'
})
export class PostmortemDocService {
  private readonly baseUrl: string;

  constructor(
    private readonly http: HttpClient,
    private readonly httpUtils: HttpUtilsService
  ) {
    this.baseUrl = this.httpUtils.getBaseUrl();
  }

  list(incidentId: number): Observable<PostmortemDocResponseInterface[]> {
    const headers = this.httpUtils.getAuthHeaders();
    const url = `${this.baseUrl}/api/incidents/${incidentId}/documents`;
    return this.http.get<PostmortemDocResponseInterface[]>(url, { headers });
  }

  get(incidentId: number, version: number, format: DocFormatEnum, disposition: DocDispositionEnum): Observable<string> {
    const headers = this.httpUtils.getAuthHeaders();
    const url = `${this.baseUrl}/api/incidents/${incidentId}/documents/${version}`;

    return this.http.get(
      url,
      {
        params: { format: format, disposition: disposition },
        headers,
        responseType: 'text' as const
      }
    );
  }

  create(incidentId: number): Observable<PostmortemDocResponseInterface> {
    const headers = this.httpUtils.getAuthHeaders();
    const url = `${this.baseUrl}/api/incidents/${incidentId}/documents`;
    return this.http.post<PostmortemDocResponseInterface>(url, {}, { headers });
  }

}
