import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CreateClientPayload } from '../interfaces/client.interface';

@Injectable({ providedIn: 'root' })
export class ClientManagementService {
    private http = inject(HttpClient);
    private url = `${environment.apiUrl}/v1/support`;

    getAvailableModules(): Observable<any> {
        return this.http.get(`${this.url}/modules`);
    }

    provisionClient(payload: CreateClientPayload): Observable<any> {
        return this.http.post(`${this.url}/clients`, payload);
    }
}
