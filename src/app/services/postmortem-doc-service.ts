import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PostmortemDocResponseInterface } from '../domain/interfaces/response/postmortem-doc-response-interface';
import { DocFormatEnum } from '../domain/enums/doc-format-enum';
import { DocDispositionEnum } from '../domain/enums/doc-disposition-enum';

@Injectable({
  providedIn: 'root'
})
export class PostmortemDocService {
  private readonly baseUrl: string = (window as any)['NG_API_DNS'] ?? 'http://localhost:8081';

  constructor(private readonly http: HttpClient) { }

  list(incidentId: number): Observable<PostmortemDocResponseInterface[]> {
    const rawToken = localStorage.getItem('token') || '';
    const token = rawToken && !rawToken.startsWith('Bearer ') ? `Bearer ${rawToken}` : rawToken;
    const headers = new HttpHeaders({ Authorization: token });

    const url = `${this.baseUrl}/api/incidents/${incidentId}/documents`;
    return this.http.get<PostmortemDocResponseInterface[]>(url, { headers });
  }

  get(incidentId: number, version: number, format: DocFormatEnum, disposition: DocDispositionEnum): Observable<string> {
    const rawToken = localStorage.getItem('token') || '';
    const token = rawToken && !rawToken.startsWith('Bearer ') ? `Bearer ${rawToken}` : rawToken;
    const headers = new HttpHeaders({ Authorization: token });

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
    const rawToken = localStorage.getItem('token') || '';
    const token = rawToken && !rawToken.startsWith('Bearer ') ? `Bearer ${rawToken}` : rawToken;
    const headers = new HttpHeaders({ Authorization: token });

    const url = `${this.baseUrl}/api/incidents/${incidentId}/documents`;
    return this.http.post<PostmortemDocResponseInterface>(url, {}, { headers });
  }

}
