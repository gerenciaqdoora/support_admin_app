import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmailSupportService {
  private _http = inject(HttpClient);
  private readonly API_URL = '/api/v1/support/emails';

  listMailables(): Observable<any> {
    return this._http.get<any>(this.API_URL);
  }

  sendTestEmail(payload: { mailable: string; to: string; data: any }): Observable<any> {
    return this._http.post<any>(`${this.API_URL}/test`, payload);
  }
}
