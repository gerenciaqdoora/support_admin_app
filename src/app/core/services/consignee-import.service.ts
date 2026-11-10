import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  AnnexMunicipality, ConsigneeImportItem, ConsigneeImportProgress, ConsigneeImportRequirements, ConsigneeImportSession,
  ImportItemFilters, NormalizedConsignee, Paginated, ParsedSigadFile, ParsedSigadRow,
} from '../models/consignee-import.model';
import { SIGAD_CLIENTES_V1 } from '../imports/sigad-clientes-v1';

interface ApiEnvelope<T> { data: T; message: string; }

/** Importación masiva de consignatarios (v1/support/companies/{id}/aduana/consignee-import). */
@Injectable({ providedIn: 'root' })
export class ConsigneeImportService {
  private _http = inject(HttpClient);

  private prefix(companyId: number): string {
    return `/api/v1/support/companies/${companyId}/aduana/consignee-import`;
  }

  private data<T>(obs: Observable<ApiEnvelope<T>>): Observable<T> {
    return obs.pipe(map((r) => r.data));
  }

  requirements(companyId: number) { return this.data(this._http.get<ApiEnvelope<ConsigneeImportRequirements>>(`${this.prefix(companyId)}/requirements`)); }
  municipalities(companyId: number) { return this.data(this._http.get<ApiEnvelope<AnnexMunicipality[]>>(`${this.prefix(companyId)}/municipalities`)); }
  activeSession(companyId: number) { return this.data(this._http.get<ApiEnvelope<ConsigneeImportSession | null>>(`${this.prefix(companyId)}/session`)); }

  createSession(companyId: number, file: File, parsed: ParsedSigadFile, replace: boolean) {
    const form = new FormData();
    form.append('file', file);
    form.append('file_name', file.name);
    form.append('total_rows', String(parsed.rows.length));
    form.append('format_code', SIGAD_CLIENTES_V1.code);
    form.append('signature', parsed.signature);
    form.append('column_headers', JSON.stringify(parsed.headers));
    form.append('replace', replace ? '1' : '0');
    return this.data(this._http.post<ApiEnvelope<ConsigneeImportSession>>(`${this.prefix(companyId)}/session`, form));
  }

  addItems(companyId: number, sessionId: number, rows: ParsedSigadRow[]) {
    return this.data(this._http.post<ApiEnvelope<{ created: number }>>(`${this.prefix(companyId)}/session/${sessionId}/items`, { rows }));
  }

  listItems(companyId: number, sessionId: number, filters: ImportItemFilters) {
    let params = new HttpParams().set('page', filters.page).set('size', filters.size);
    for (const key of ['status', 'issue', 'search', 'group_key'] as const) {
      const value = filters[key];
      if (value) params = params.set(key, value);
    }
    return this.data(this._http.get<ApiEnvelope<Paginated<ConsigneeImportItem>>>(`${this.prefix(companyId)}/session/${sessionId}/items`, { params }));
  }

  updateItem(companyId: number, itemId: number, normalized: NormalizedConsignee) {
    return this.data(this._http.put<ApiEnvelope<ConsigneeImportItem>>(`${this.prefix(companyId)}/items/${itemId}`, { normalized }));
  }

  verifyItem(companyId: number, itemId: number, codes: string[]) {
    return this.data(this._http.post<ApiEnvelope<ConsigneeImportItem>>(`${this.prefix(companyId)}/items/${itemId}/verify`, { warning_codes: codes }));
  }

  bulkVerify(companyId: number, sessionId: number, code: string, itemIds: number[]) {
    return this.data(this._http.post<ApiEnvelope<{ verified: number }>>(`${this.prefix(companyId)}/session/${sessionId}/items/verify`, { warning_code: code, item_ids: itemIds }));
  }

  skipItem(companyId: number, itemId: number) { return this.data(this._http.post<ApiEnvelope<ConsigneeImportItem>>(`${this.prefix(companyId)}/items/${itemId}/skip`, {})); }
  restoreItem(companyId: number, itemId: number) { return this.data(this._http.post<ApiEnvelope<ConsigneeImportItem>>(`${this.prefix(companyId)}/items/${itemId}/restore`, {})); }
  chooseBranch(companyId: number, itemId: number) { return this.data(this._http.post<ApiEnvelope<{ chosen: number; skipped_ids: number[] }>>(`${this.prefix(companyId)}/items/${itemId}/choose-branch`, {})); }

  execute(companyId: number, sessionId: number) { return this.data(this._http.post<ApiEnvelope<{ status: string; to_process: number }>>(`${this.prefix(companyId)}/session/${sessionId}/execute`, {})); }
  progress(companyId: number, sessionId: number) { return this.data(this._http.get<ApiEnvelope<ConsigneeImportProgress>>(`${this.prefix(companyId)}/session/${sessionId}/progress`)); }
  abort(companyId: number, sessionId: number) { return this._http.delete<ApiEnvelope<unknown>>(`${this.prefix(companyId)}/session/${sessionId}`); }

  backupUrl(companyId: number, sessionId: number, file: 'original' | 'snapshot') {
    const params = new HttpParams().set('file', file);
    return this.data(this._http.get<ApiEnvelope<{ url: string; expires_at: string }>>(`${this.prefix(companyId)}/session/${sessionId}/backup`, { params }));
  }
}
