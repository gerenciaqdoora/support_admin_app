import { Injectable } from '@angular/core';
import { EMPLEADOS_V1 } from '../imports/empleados-v1';
import { AuxiliaryRoleParser } from './auxiliary-role-parser';

/** Lee la plantilla de empleados en el navegador y valida el formato EMPLEADOS_V1. */
@Injectable({ providedIn: 'root' })
export class EmployeeImportParserService extends AuxiliaryRoleParser {
  constructor() {
    super(EMPLEADOS_V1, { plural: 'empleados', singular: 'empleado', master: 'Remuneraciones por Pagar', nameHelp: 'Nombre completo del empleado.' });
  }
}
