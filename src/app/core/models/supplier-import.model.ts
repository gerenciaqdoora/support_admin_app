import { ImportInfo, ImportIssue, ImportItemStatus, ImportWarning } from './consignee-import.model';

export interface SupplierCandidate { id: number; rut: string; name: string; }
export interface SupplierIssue extends ImportIssue { candidates?: SupplierCandidate[]; }

export interface NormalizedSupplier {
  code: string | null; rut: string | null; name: string | null; account_code: string | null;
  name_choice: 'keep_existing' | 'replace' | null;
}

export type SupplierSkipReason = 'already_in_role' | 'manual';

export interface SupplierImportItem {
  id: number; row_number: number; status: ImportItemStatus;
  original: Record<string, string | null>; normalized: NormalizedSupplier;
  errors: SupplierIssue[]; warnings: ImportWarning[]; infos: ImportInfo[]; branch?: null;
  skip_reason: SupplierSkipReason | null;
  result: { third_company_id: number; auxiliary: 'created' | 'linked'; name_replaced: boolean } | null;
  failure_message: string | null; updated_by: number | null;
}

export interface MasterAccountSummary { code: string; display_code: string; name: string; node_type: string; }

/** Cuenta maestra vigente frente a la cuenta mayor que trae el archivo. */
export interface AccountCheck {
  master: MasterAccountSummary | null;
  file_codes: string[];
  matches: boolean | null;
  can_reassign: boolean;
  target: { code: string; name: string; type: string } | null;
  impact: { members_on_current_master: number };
}

export interface SupplierImportRequirements {
  ready: boolean;
  modules: { aduana: boolean; contabilidad: boolean; account_plan: boolean };
  role_account: MasterAccountSummary | null;
  blockers: { code: string; message: string }[];
}
