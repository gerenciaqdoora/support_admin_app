import { Injectable } from '@angular/core';
import { PROVEEDORES_V1 } from '../imports/proveedores-v1';
import { AuxiliaryRoleParser } from './auxiliary-role-parser';

/** Lee la plantilla de proveedores en el navegador y valida el formato PROVEEDORES_V1. */
@Injectable({ providedIn: 'root' })
export class SupplierImportParserService extends AuxiliaryRoleParser {
  constructor() {
    super(PROVEEDORES_V1, { plural: 'proveedores', singular: 'proveedor', master: 'Proveedor Nacional', nameHelp: 'Razón social o nombre del proveedor.' });
  }
}
