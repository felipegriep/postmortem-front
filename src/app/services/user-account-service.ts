import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserAccountResponseInterface } from '../domain/interfaces/response/user-account-response-interface';

@Injectable({
    providedIn: 'root',
})
export class UserAccountService {
    private readonly baseUrl: string = (window as any)['NG_API_DNS'] ?? 'http://localhost:8081';

    constructor(private readonly http: HttpClient) {}

    list(): Observable<UserAccountResponseInterface[]> {
        const rawToken = localStorage.getItem('token') ?? '';
        const token = rawToken && !rawToken.startsWith('Bearer ') ? `Bearer ${rawToken}` : rawToken;
        const headers = new HttpHeaders({ Authorization: token });

        const url = `${this.baseUrl}/api/users`;
        return this.http.get<UserAccountResponseInterface[]>(url, { headers });
    }
}
