import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  RcvApplyPreview, RcvDefaultConfig, RcvDefaultPayload, RcvDefaultRun, RcvDefaultsState, RcvEligibleAccount,
  RcvOperation, RcvValueType,
} from '../models/rcv-defaults.model';

interface Envelope<T> { data: T; message: string; }

/**
 * Cuentas RCV por defecto de una empresa (v1/support/companies/{id}/rcv-defaults).
 * Son las mismas que edita el Portal Cliente: las heredan los auxiliares con rol cliente o proveedor.
 */
@Injectable({ providedIn: 'root' })
export class RcvDefaultsService {
  private readonly http = inject(HttpClient);

  private prefix(companyId: number): string {
    return `/api/v1/support/companies/${companyId}/rcv-defaults`;
  }

  state(companyId: number): Observable<RcvDefaultsState> {
    return this.http.get<Envelope<RcvDefaultsState>>(this.prefix(companyId)).pipe(map((r) => r.data));
  }

  /** Cuentas operativas de la naturaleza que se pueden elegir como default. */
  accounts(companyId: number, operation: RcvOperation): Observable<RcvEligibleAccount[]> {
    return this.http
      .get<Envelope<{ record: RcvEligibleAccount[] }>>(`${this.prefix(companyId)}/accounts/${operation}`)
      .pipe(map((r) => r.data.record ?? []));
  }

  /** Guarda un default. No lo aplica a los auxiliares existentes. */
  save(companyId: number, operation: RcvOperation, valueType: RcvValueType, payload: RcvDefaultPayload): Observable<RcvDefaultConfig> {
    return this.http
      .put<Envelope<{ record: RcvDefaultConfig }>>(`${this.prefix(companyId)}/${operation}/${valueType}`, payload)
      .pipe(map((r) => r.data.record));
  }

  /** Conteo previo de lo que cambiaría aplicar los defaults. Soporte solo completa lo que falta. */
  preview(companyId: number, operation: RcvOperation): Observable<RcvApplyPreview> {
    const params = new HttpParams().set('operation', operation).set('mode', 'only_missing');
    return this.http.get<Envelope<RcvApplyPreview>>(`${this.prefix(companyId)}/apply/preview`, { params }).pipe(map((r) => r.data));
  }

  /** Inicia la aplicación en segundo plano y devuelve el id de la ejecución. */
  apply(companyId: number, operation: RcvOperation): Observable<number> {
    return this.http
      .post<Envelope<{ run_id: number }>>(`${this.prefix(companyId)}/apply`, { operation, mode: 'only_missing' })
      .pipe(map((r) => r.data.run_id));
  }

  run(companyId: number, runId: number): Observable<RcvDefaultRun> {
    return this.http.get<Envelope<RcvDefaultRun>>(`${this.prefix(companyId)}/apply/${runId}`).pipe(map((r) => r.data));
  }
}
