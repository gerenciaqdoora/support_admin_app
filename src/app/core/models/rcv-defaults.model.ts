export type RcvOperation = 'purchase' | 'sale';
export type RcvValueType = 'affected' | 'exempt';

/** Cuenta por defecto de la empresa (imputación `rcv_default_{operation}_{value_type}`). */
export interface RcvDefaultConfig {
  id: number;
  purpose: string;
  account_id: number;
  sub_account_id: number | null;
  account_code?: string;
  account_name?: string;
  sub_account_code?: string;
  sub_account_name?: string;
  auxiliary_id: number | null;
  cost_center_id: number | null;
  needs_review: boolean;
  review_reason: string | null;
}

export interface RcvPrerequisites {
  ready: boolean;
  missing: string[];
}

export interface RcvDefaultsState {
  config: RcvDefaultConfig[];
  prerequisites: { sale: RcvPrerequisites; purchase: RcvPrerequisites };
}

export interface RcvPreviewCounts {
  a_crear: number;
  a_reemplazar: number;
  sin_cambios: number;
}

export interface RcvApplyPreview {
  total_auxiliares: number;
  affected: RcvPreviewCounts | null;
  exempt: RcvPreviewCounts | null;
}

export interface RcvRunError {
  auxiliary_id: number;
  auxiliary_name: string | null;
  reason: string;
}

export interface RcvDefaultRun {
  run_id: number;
  operation: RcvOperation;
  mode: 'only_missing' | 'replace_all';
  status: 'queued' | 'running' | 'done' | 'failed';
  total: number;
  applied: number;
  skipped: number;
  failed: number;
  percent: number;
  errors: RcvRunError[];
  started_at: string | null;
  finished_at: string | null;
}

export interface RcvDefaultPayload {
  account_id: number;
  type: 'cuenta' | 'subcuenta';
  auxiliary_id?: number | null;
  cost_center_id?: number | null;
}

/** Cuenta elegible para una naturaleza, tal como la entrega `accounts/{operation}`. */
export interface RcvEligibleAccount {
  account_id: number;
  code: string;
  name: string;
  type: 'cuenta' | 'subcuenta';
  wk_auxiliary_rut?: boolean;
  wk_auxiliary_concept?: boolean;
  wk_cost_center?: boolean;
}
