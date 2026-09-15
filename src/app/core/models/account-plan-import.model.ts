/** Fila cruda del archivo del cliente, ya normalizada por el parser. */
export interface AccountPlanImportRow {
  code: string;
  name: string;
  sigla: string | null;
  /** Clase contable declarada por el archivo (Activo, Pasivo, Ingreso, Gasto...). */
  class: string | null;
}

/** Largos propios por nivel que declara el operador. */
export interface AccountPlanLargos {
  tipo: number;
  subtipo: number;
  cuenta: number;
  subcuenta: number;
}

export interface AccountPlanPreviewNode {
  code: string;
  name: string;
  sigla?: string | null;
  is_generated?: boolean;
  is_empty?: boolean;
  account_category_code?: string | null;
  show_in_cash_box?: boolean;
  show_in_bank?: boolean;
  show_in_treasury?: boolean;
  trabaja_como_activo_fijo?: boolean;
  trabaja_con_auxiliar_con_rut?: boolean;
  trabaja_con_auxiliar_sin_rut?: boolean;
  /** Solo poblado en los nodos de `tipos`: clase resuelta para ese dígito. */
  type_class_code?: string;
}

export interface AccountPlanPreview {
  level: 'tipo' | 'subtipo' | 'cuenta' | 'subcuenta';
  largos: AccountPlanLargos;
  tipos: AccountPlanPreviewNode[];
  subtipos: AccountPlanPreviewNode[];
  cuentas: AccountPlanPreviewNode[];
  subcuentas: AccountPlanPreviewNode[];
  warnings: string[];
  totals: {
    tipos: number;
    subtipos: number;
    cuentas: number;
    subcuentas: number;
    warnings: number;
  };
}
