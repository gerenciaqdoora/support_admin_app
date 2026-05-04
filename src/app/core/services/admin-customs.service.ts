import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AduanaSubscriberData, AduanaSubscriberResponse, AduanaAgent } from '../models/aduana-subscriber.model';

@Injectable({
  providedIn: 'root',
})
export class AdminCustomsService {
  private _http = inject(HttpClient);

  /**
   * Crea un nuevo suscriptor de aduana desde el portal administrativo.
   * Requiere rol ADMIN_ROLE.
   */
  createAduanaSubscriber(data: AduanaSubscriberData): Observable<AduanaSubscriberResponse> {
    return this._http
      .post<{ data: AduanaSubscriberResponse }>('/v1/support/create/aduana-subscriber', data)
      .pipe(map((res) => res.data));
  }

  /**
   * Obtiene la lista de agentes oficiales del Anexo 51.
   */
  getAduanaAgents(): Observable<AduanaAgent[]> {
    return this._http
      .get<{ data: AduanaAgent[] }>('/v1/support/aduana-agents')
      .pipe(map((res) => res.data));
  }
}
