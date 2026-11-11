import { Injectable } from '@angular/core';
import { EMISORES_V1 } from '../imports/emisores-v1';
import { AuxiliaryRoleImportApi } from './auxiliary-role-import-api';

/** Importación masiva de emisores (v1/support/companies/{id}/aduana/issuer-import). */
@Injectable({ providedIn: 'root' })
export class IssuerImportService extends AuxiliaryRoleImportApi {
  protected readonly segment = 'issuer-import';
  protected readonly formatCode = EMISORES_V1.code;
}
