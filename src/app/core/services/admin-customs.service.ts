import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AduanaSubscriberData, AduanaSubscriberResponse, AduanaAgent } from '../models/aduana-subscriber.model';
import { AccountPlanImportRow, AccountPlanPreview } from '../models/account-plan-import.model';

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

  /**
   * Interpreta el archivo de plan de cuentas sin persistir nada: devuelve el
   * árbol previsto y las advertencias para que el operador confirme antes de
   * crear al suscriptor.
   */
  previewAccountPlan(payload: { largos: number[]; rows: AccountPlanImportRow[] }): Observable<AccountPlanPreview> {
    return this._http
      .post<{ data: AccountPlanPreview }>('/v1/support/account-plan/import/preview', payload)
      .pipe(map((res) => res.data));
  }
}
