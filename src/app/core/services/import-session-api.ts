import { HttpClient, HttpParams } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  ConsigneeImportProgress, ConsigneeImportSession, ImportItemFilters, MasterAccountOptions, Paginated, ParsedSigadFile, ParsedSigadRow,
} from '../models/consignee-import.model';

export interface ApiEnvelope<T> { data: T; message: string; }

/** Lo mínimo que la pantalla de importación necesita de los requisitos de cada importación. */
/** Cuenta maestra adicional que la importación muestra y deja asignar desde el plan de la empresa (p. ej. Retención 2ª Categoría en emisores). */
export interface ExtraMasterAccount {
  /** Clave de la ruta (`extra-account/{key}`). */
  key: string;
  category_code: string;
  label: string;
  /** La empresa tiene Aduana, Contabilidad y plan de cuentas: solo entonces se puede asignar. */
  assignable: boolean;
  account: { account_id: number; code: string; display_code: string; name: string; node_type: string } | null;
  /** Solo cuentas de IVA: si la cuenta está asociada al impuesto IVA GENERAL (null = no aplica o sin cuenta). */
  tax_linked: boolean | null;
}

export interface ImportRequirementsBase {
  ready: boolean;
  modules?: { aduana: boolean; contabilidad: boolean; account_plan: boolean };
  blockers: { code: string; message: string }[];
  role_account?: { code: string; display_code: string; name: string; node_type: string } | null;
  extra_accounts?: ExtraMasterAccount[];
}

/**
 * Operaciones comunes de una importación masiva (v1/support/companies/{id}/aduana/{segmento}).
 * Cada importación define su segmento y lo propio (requisitos, creación de sesión, verificaciones).
 */
export abstract class ImportSessionApi<TItem, TNormalized> {
  protected readonly _http = inject(HttpClient);
  protected abstract readonly segment: string;

  abstract requirements(companyId: number): Observable<ImportRequirementsBase>;

  /** Cada importación arma su formulario multipart (formato, encabezados y firma propios). */
  abstract createSession(companyId: number, file: File, parsed: ParsedSigadFile, replace: boolean): Observable<ConsigneeImportSession>;

  protected prefix(companyId: number): string {
    return `/api/v1/support/companies/${companyId}/aduana/${this.segment}`;
  }

  protected data<T>(obs: Observable<ApiEnvelope<T>>): Observable<T> {
    return obs.pipe(map((r) => r.data));
  }

  activeSession(companyId: number) { return this.data(this._http.get<ApiEnvelope<ConsigneeImportSession | null>>(`${this.prefix(companyId)}/session`)); }

  addItems(companyId: number, sessionId: number, rows: ParsedSigadRow[]) {
    return this.data(this._http.post<ApiEnvelope<{ created: number }>>(`${this.prefix(companyId)}/session/${sessionId}/items`, { rows }));
  }

  listItems(companyId: number, sessionId: number, filters: ImportItemFilters) {
    let params = new HttpParams().set('page', filters.page).set('size', filters.size);
    for (const key of ['status', 'issue', 'search', 'group_key'] as const) {
      const value = filters[key];
      if (value) params = params.set(key, value);
    }
    return this.data(this._http.get<ApiEnvelope<Paginated<TItem>>>(`${this.prefix(companyId)}/session/${sessionId}/items`, { params }));
  }

  updateItem(companyId: number, itemId: number, normalized: TNormalized) {
    return this.data(this._http.put<ApiEnvelope<TItem>>(`${this.prefix(companyId)}/items/${itemId}`, { normalized }));
  }

  /** Da por correctas las advertencias indicadas de una fila (p. ej. caracteres dañados corregidos por el servidor). */
  verifyItem(companyId: number, itemId: number, codes: string[]) {
    return this.data(this._http.post<ApiEnvelope<TItem>>(`${this.prefix(companyId)}/items/${itemId}/verify`, { warning_codes: codes }));
  }

  bulkVerify(companyId: number, sessionId: number, code: string, itemIds: number[]) {
    return this.data(this._http.post<ApiEnvelope<{ verified: number }>>(`${this.prefix(companyId)}/session/${sessionId}/items/verify`, { warning_code: code, item_ids: itemIds }));
  }

  skipItem(companyId: number, itemId: number) { return this.data(this._http.post<ApiEnvelope<TItem>>(`${this.prefix(companyId)}/items/${itemId}/skip`, {})); }
  restoreItem(companyId: number, itemId: number) { return this.data(this._http.post<ApiEnvelope<TItem>>(`${this.prefix(companyId)}/items/${itemId}/restore`, {})); }

  execute(companyId: number, sessionId: number) { return this.data(this._http.post<ApiEnvelope<{ status: string; to_process: number }>>(`${this.prefix(companyId)}/session/${sessionId}/execute`, {})); }
  progress(companyId: number, sessionId: number) { return this.data(this._http.get<ApiEnvelope<ConsigneeImportProgress>>(`${this.prefix(companyId)}/session/${sessionId}/progress`)); }
  abort(companyId: number, sessionId: number) { return this._http.delete<ApiEnvelope<unknown>>(`${this.prefix(companyId)}/session/${sessionId}`); }

  backupUrl(companyId: number, sessionId: number, file: 'original' | 'snapshot') {
    const params = new HttpParams().set('file', file);
    return this.data(this._http.get<ApiEnvelope<{ url: string; expires_at: string }>>(`${this.prefix(companyId)}/session/${sessionId}/backup`, { params }));
  }

  /** Lo atienden las importaciones por rol (proveedores, empleados). */
  reassignMasterAccount(companyId: number, sessionId: number) {
    return this.data(this._http.put<ApiEnvelope<ConsigneeImportSession>>(`${this.prefix(companyId)}/session/${sessionId}/master-account`, {}));
  }

  /** Cuentas del plan que pueden ser la maestra de `path` (`master-account` por defecto) y cuántos auxiliares cuentan hoy con la actual. */
  masterAccountOptions(companyId: number, path = 'master-account') {
    return this.data(this._http.get<ApiEnvelope<MasterAccountOptions>>(`${this.prefix(companyId)}/${path}/options`));
  }

  /** Asigna la cuenta maestra de `path`; responde con los requisitos recalculados. */
  assignMasterAccount(companyId: number, account: { type: string; account_id: number }, path = 'master-account') {
    return this.data(this._http.put<ApiEnvelope<ImportRequirementsBase>>(`${this.prefix(companyId)}/${path}`, account));
  }
}
