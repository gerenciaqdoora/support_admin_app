import { Injectable } from '@angular/core';
import { EMISORES_V1 } from '../imports/emisores-v1';
import { AuxiliaryRoleParser } from './auxiliary-role-parser';

/** Lee la plantilla de emisores en el navegador y valida el formato EMISORES_V1. */
@Injectable({ providedIn: 'root' })
export class IssuerImportParserService extends AuxiliaryRoleParser {
  constructor() {
    super(EMISORES_V1, { plural: 'emisores', singular: 'emisor', master: 'Honorarios por Pagar', nameHelp: 'Nombre completo del emisor de la boleta de honorarios.' });
  }
}
