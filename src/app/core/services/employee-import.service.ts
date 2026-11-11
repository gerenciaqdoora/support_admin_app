import { Injectable } from '@angular/core';
import { EMPLEADOS_V1 } from '../imports/empleados-v1';
import { AuxiliaryRoleImportApi } from './auxiliary-role-import-api';

/** Importación masiva de empleados (v1/support/companies/{id}/aduana/employee-import). */
@Injectable({ providedIn: 'root' })
export class EmployeeImportService extends AuxiliaryRoleImportApi {
  protected readonly segment = 'employee-import';
  protected readonly formatCode = EMPLEADOS_V1.code;
}
