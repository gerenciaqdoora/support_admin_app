/**
 * Formato aceptado para la importación masiva de consignatarios: "Listado de clientes" de SIGAD.
 * Espejo de qdoora-api/app/Support/Imports/SigadClientesV1.php: todo cambio va en ambos archivos.
 */
export const SIGAD_CLIENTES_V1 = {
  code: 'SIGAD_CLIENTES_V1',
  signature: 'LISTADO DE CLIENTES',
  signatureRow: 2,
  headerRow: 3,
  firstDataRow: 4,
  headers: {
    B: 'CODIGO', C: 'RAZON SOC. ADUANERA', D: 'RAZON SOC. CONTABLE', E: 'RUT / PASAPORTE', F: 'DIRECCION',
    G: 'COMUNA', H: 'COD. COMUNA', I: 'CIUDAD', J: 'EMAIL CLIENTE', K: '1ER. NOM.REP.LEG. IMPO.',
    L: '2DO. NOM.REP.LEG. IMPO.', M: 'APELLIDO PATERNO', N: 'APELLIDO MATERNO', O: 'RUT REP.IMPO',
    P: 'MAIL REPRESENTANTE IMPO', Q: '1ER. NOM.REP.LEG. EXP.', R: '2DO. NOM.REP.LEG.EXP.', S: 'APELLIDO PATERNO',
    T: 'APELLIDO MATERNO', U: 'RUT REP.EXPO', V: 'MAIL REPRESENTANTE EXPO.', AC: 'GIRO', AH: 'ID_CLIENTE',
    AI: 'ACTIVO', CN: 'FONO COMERCIAL',
  } as Record<string, string>,
} as const;

/** Mayúsculas, sin tildes, espacios y saltos de línea colapsados (igual que el backend). */
export function normalizeHeader(value: unknown): string {
  return String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim().toUpperCase();
}

/** Etiquetas en español de los códigos de problema que entrega el backend. */
export const ISSUE_LABELS: Record<string, string> = {
  DOCUMENT_REQUIRED: 'Falta RUT o pasaporte', DOCUMENT_INVALID: 'RUT inválido o de relleno',
  NAME_REQUIRED: 'Falta nombre', NAME_TOO_LONG: 'Nombre muy largo', ADDRESS_REQUIRED: 'Falta dirección',
  ADDRESS_TOO_LONG: 'Dirección muy larga', MUNICIPALITY_REQUIRED: 'Comuna desconocida', EMAIL_INVALID: 'Email inválido',
  GIRO_TOO_LONG: 'Giro muy largo', LEGAL_REP_REQUIRED: 'Jurídica sin representante',
  LEGAL_REP_NOT_ALLOWED: 'Natural con representantes', LEGAL_REP_NAME_REQUIRED: 'Representante sin nombre',
  LEGAL_REP_RUT_INVALID: 'RUT de representante inválido', LEGAL_REP_EMAIL_INVALID: 'Email de representante inválido',
  BRANCH_PENDING: 'Sucursal por elegir', BROKEN_CHARACTERS: 'Caracteres corregidos',
};

/** Nombre legible de cada columna del listado SIGAD que se muestra en la vista de trabajo (la clave es la letra de la hoja). */
export const COLUMN_LABELS: Record<string, string> = {
  B: 'Código cliente', D: 'Razón social', E: 'RUT / Pasaporte', F: 'Dirección', G: 'Comuna', H: 'Código comuna',
  J: 'Email cliente', K: '1er nombre rep. (imp.)', L: '2do nombre rep. (imp.)', M: 'Apellido paterno rep.',
  N: 'Apellido materno rep.', O: 'RUT rep. (imp.)', P: 'Email rep. (imp.)', Q: '1er nombre rep. (exp.)',
  U: 'RUT rep. (exp.)', V: 'Email rep. (exp.)', AC: 'Giro', AH: 'ID cliente', AI: 'Activo', CN: 'Teléfono',
};
