import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserAccountResponseInterface } from '../domain/interfaces/response/user-account-response-interface';
import { HttpUtilsService } from '../shared/http-utils.service';

@Injectable({
    providedIn: 'root',
})
export class UserAccountService {
    private readonly baseUrl: string;

    constructor(
        private readonly http: HttpClient,
        private readonly httpUtils: HttpUtilsService
    ) {
        this.baseUrl = this.httpUtils.getBaseUrl();
    }

    list(): Observable<UserAccountResponseInterface[]> {
        const headers = this.httpUtils.getAuthHeaders();
        const url = `${this.baseUrl}/api/users`;
        return this.http.get<UserAccountResponseInterface[]>(url, { headers });
    }
}
