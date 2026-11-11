import { Injectable } from '@angular/core';
import { PROVEEDORES_V1 } from '../imports/proveedores-v1';
import { AuxiliaryRoleImportApi } from './auxiliary-role-import-api';

/** Importación masiva de proveedores (v1/support/companies/{id}/aduana/supplier-import). */
@Injectable({ providedIn: 'root' })
export class SupplierImportService extends AuxiliaryRoleImportApi {
  protected readonly segment = 'supplier-import';
  protected readonly formatCode = PROVEEDORES_V1.code;
}
