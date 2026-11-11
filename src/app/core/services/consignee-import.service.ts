import { Injectable } from '@angular/core';
import {
  AnnexMunicipality, ConsigneeImportItem, ConsigneeImportRequirements, ConsigneeImportSession,
  NormalizedConsignee, ParsedSigadFile,
} from '../models/consignee-import.model';
import { SIGAD_CLIENTES_V1 } from '../imports/sigad-clientes-v1';
import { ApiEnvelope, ImportSessionApi } from './import-session-api';

/** Importación masiva de consignatarios (v1/support/companies/{id}/aduana/consignee-import). */
@Injectable({ providedIn: 'root' })
export class ConsigneeImportService extends ImportSessionApi<ConsigneeImportItem, NormalizedConsignee> {
  protected readonly segment = 'consignee-import';

  requirements(companyId: number) { return this.data(this._http.get<ApiEnvelope<ConsigneeImportRequirements>>(`${this.prefix(companyId)}/requirements`)); }
  municipalities(companyId: number) { return this.data(this._http.get<ApiEnvelope<AnnexMunicipality[]>>(`${this.prefix(companyId)}/municipalities`)); }

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

  chooseBranch(companyId: number, itemId: number) { return this.data(this._http.post<ApiEnvelope<{ chosen: number; skipped_ids: number[] }>>(`${this.prefix(companyId)}/items/${itemId}/choose-branch`, {})); }
}
