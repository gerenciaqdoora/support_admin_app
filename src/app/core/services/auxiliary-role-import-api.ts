import { ConsigneeImportSession, ParsedSigadFile } from '../models/consignee-import.model';
import { NormalizedSupplier, SupplierImportItem, SupplierImportRequirements } from '../models/supplier-import.model';
import { ApiEnvelope, ImportSessionApi } from './import-session-api';

/** Operaciones comunes de las importaciones por rol (proveedores, empleados): cada una aporta su segmento y su formato. */
export abstract class AuxiliaryRoleImportApi extends ImportSessionApi<SupplierImportItem, NormalizedSupplier> {
  protected abstract readonly formatCode: string;

  requirements(companyId: number) { return this.data(this._http.get<ApiEnvelope<SupplierImportRequirements>>(`${this.prefix(companyId)}/requirements`)); }

  createSession(companyId: number, file: File, parsed: ParsedSigadFile, replace: boolean) {
    const form = new FormData();
    form.append('file', file);
    form.append('file_name', file.name);
    form.append('total_rows', String(parsed.rows.length));
    form.append('format_code', this.formatCode);
    form.append('signature', parsed.signature);
    form.append('column_headers', JSON.stringify(parsed.headers));
    form.append('replace', replace ? '1' : '0');
    return this.data(this._http.post<ApiEnvelope<ConsigneeImportSession>>(`${this.prefix(companyId)}/session`, form));
  }
}
