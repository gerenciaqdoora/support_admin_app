import { normalizeHeader } from './sigad-clientes-v1';

export interface ListFormat {
  code: string;
  sheetName: string;
  headerRow: number;
  firstDataRow: number;
  headers: Record<string, string>;
  required: string[];
  labels: Record<string, string>;
}

/** Formato amigable de importación de auxiliares por rol: hoja con encabezados en la fila 1. Espejo de AuxiliaryRoleFormat.php. */
export function listFormat(code: string, sheetName: string): ListFormat {
  return {
    code,
    sheetName,
    headerRow: 1,
    firstDataRow: 2,
    headers: { code: 'CODIGO', rut: 'RUT', name: 'NOMBRE', account_code: 'CUENTA MAYOR' },
    required: ['code', 'rut', 'name'],
    labels: { code: 'Código', rut: 'RUT', name: 'Nombre', account_code: 'Cuenta mayor' },
  };
}

export const PROVEEDORES_V1 = listFormat('PROVEEDORES_V1', 'Proveedores');

export const SUPPLIER_ISSUE_LABELS: Record<string, string> = {
  CODE_REQUIRED: 'Falta código', CODE_TOO_LONG: 'Código muy largo', NAME_REQUIRED: 'Falta nombre', NAME_TOO_LONG: 'Nombre muy largo',
  RUT_REQUIRED: 'Falta RUT', RUT_INVALID: 'RUT inválido', CODE_IN_USE: 'Código de otro auxiliar', AUX_HAS_OTHER_CODE: 'Auxiliar con otro código',
  CODE_DUPLICATED: 'Código repetido', RUT_DUPLICATED: 'RUT repetido', NAME_DIFFERS: 'Nombre distinto', BROKEN_CHARACTERS: 'Caracteres corregidos',
};

export { normalizeHeader };
