import type { AccountCheck } from './supplier-import.model';

export type ImportItemStatus = 'pending' | 'edited' | 'ready' | 'skipped' | 'imported' | 'failed';
export type ImportSessionStatus = 'initialized' | 'in_progress' | 'processing' | 'completed' | 'aborted' | 'error';
export type SkipReason = 'inactive' | 'already_consignee' | 'branch_discarded' | 'manual';

export interface ImportIssue { code: string; field: string | null; message: string; }
export interface ImportWarning extends ImportIssue {
  level: 'warning'; original: string; suggested: string;
  verified: boolean; verified_by: number | null; verified_at: string | null; bulk: boolean;
}
export interface ImportInfo { code: string; level: 'info'; field: null; message: string; }

export interface LegalRepresentativeRow { kind: 'IMPO' | 'EXPO'; name: string; rut: string; email: string | null; is_default: boolean; }

export interface NormalizedConsignee {
  document_code: '03' | '04'; document_number: string | null; person_type: 'JURIDICA' | 'NATURAL';
  name: string; address: string; municipality_id: number | null;
  email: string | null; phone: string | null; giro: string | null;
  legal_representatives: LegalRepresentativeRow[];
  external_code: string | null;
}

export interface ConsigneeImportItem {
  id: number; row_number: number; status: ImportItemStatus;
  original: Record<string, string | null>; normalized: NormalizedConsignee;
  errors: ImportIssue[]; warnings: ImportWarning[]; infos: ImportInfo[];
  branch: { group_key: string; size: number; chosen: boolean } | null;
  skip_reason: SkipReason | null;
  result: { consignee_id: number; third_company_id: number; auxiliary: 'created' | 'linked' } | null;
  failure_message: string | null; updated_by: number | null;
}

export interface ConsigneeImportSession {
  id: number; status: ImportSessionStatus; file_name: string | null; total_rows: number | null; format_code: string;
  created_at: string; user_name: string | null;
  counts: Partial<Record<ImportItemStatus, number>>; issues: Record<string, number>;
  has_backup: { original: boolean; snapshot: boolean };
  /** Solo lo trae la importación de proveedores: cuenta maestra frente a la cuenta mayor del archivo. */
  account_check?: AccountCheck;
}

export interface ConsigneeImportRequirements {
  ready: boolean;
  modules: { aduana: boolean; contabilidad: boolean; account_plan: boolean };
  client_account: { code: string; name: string; node_type: string } | null;
  blockers: { code: string; message: string }[];
}

export interface ConsigneeImportProgress { status: ImportSessionStatus; total: number; counts: Partial<Record<ImportItemStatus, number>>; }

export interface Pagination { length: number; size: number; page: number; lastPage: number; startIndex: number; endIndex: number; }
export interface Paginated<T> { records: T[]; pagination: Pagination; }

export interface ImportItemFilters { status?: ImportItemStatus | null; issue?: string | null; search?: string | null; group_key?: string | null; page: number; size: number; }

export interface ParsedSigadRow { row_number: number; columns: Record<string, string | null>; }
export interface ParsedSigadFile { signature: string; headers: Record<string, string>; rows: ParsedSigadRow[]; errors: string[]; inactive: number; }

export interface AnnexMunicipality { id: number; code: string; name: string; }
