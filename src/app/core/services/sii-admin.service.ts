import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

/** Envoltorio uniforme de la API (helper jsonResponse de Laravel). */
interface ApiEnvelope<T> {
  data: T;
  status: number;
  message: string;
  errors: unknown[];
}

/**
 * Estado del certificado digital de una empresa (espejo de CertificateResource).
 * Nunca incluye la ruta S3 ni la contraseña cifrada.
 */
export interface SiiCertificate {
  id: number;
  company_id: number;
  holder_rut: string | null;
  holder_name: string | null;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  days_until_expiry: number | null;
  status: 'valid' | 'expiring' | 'expired' | 'unknown';
}

/** CAF de una empresa (espejo de CafResource). */
export interface SiiCaf {
  id: number;
  doc_tributary_code: string | number;
  /** Nombre del tipo de documento (core_documents.name); null si no está catalogado. */
  doc_name: string | null;
  /** Ambiente del rango: un CAF solo sirve para emitir en su propio ambiente. */
  environment: 'certificacion' | 'produccion';
  folio_from: number;
  folio_to: number;
  next_folio: number;
  total_folios: number;
  remaining_folios: number;
  consumed_pct: number;
  is_active: boolean;
  is_exhausted: boolean;
  authorized_at: string | null;
  expires_at: string | null;
}

/**
 * Acta de habilitación de producción emitida por Soporte (espejo de
 * EnablementRequestResource). Registro histórico: no se modifica ni se borra.
 */
export interface SiiEnablementActa {
  id: number;
  company_id: number;
  status: 'pending' | 'approved' | 'rejected';
  requested_by: number;
  requested_at: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  resolution_num: string | null;
  resolution_date: string | null;
  notes: string | null;
}

export type CertificationProcessType = 'documentos' | 'boleta';
export type CertificationStepStatus = 'pending' | 'in_progress' | 'done';
export type SiiOnboardingPath = 'certificacion' | 'emisor_existente';

/**
 * Paso del checklist. Los `computed` se derivan de datos reales (certificado
 * vigente, CAF activo, casos aceptados) y no se pueden marcar a mano.
 */
export interface CertificationStep {
  step_key: string;
  kind: 'manual' | 'computed';
  status: CertificationStepStatus;
  completed_at?: string | null;
  notes?: string | null;
  cases_total?: number;
  cases_accepted?: number;
  /** Solo en el ensayo de la vía emisor_existente. */
  expected_codes?: string[];
  missing_codes?: string[];
}

/** Documento tributario vinculado a un caso (venta o compra). */
export interface CertificationLinkedDocument {
  id: number | null;
  folio: number | null;
  track_id: string | null;
  sii_status: string | null;
}

/**
 * Caso del Set de Pruebas / ensayo. Factura de Compra (46) se vincula por
 * `purchase`; el resto de los DTE por `sale`.
 */
export interface CertificationCase {
  id: number;
  process_type: CertificationProcessType;
  attention_number: string | null;
  case_number: string | null;
  dte_type_code: string;
  description: string;
  notes: string | null;
  sale: CertificationLinkedDocument | null;
  purchase: CertificationLinkedDocument | null;
}

export interface CertificationProcess {
  steps: CertificationStep[];
  cases: CertificationCase[];
  /** false ⇒ el proceso no aplica a la empresa y no bloquea producción. */
  applicable: boolean;
}

export interface CertificationOverview {
  processes: Record<CertificationProcessType, CertificationProcess>;
  read_only: boolean;
  onboarding_path: SiiOnboardingPath;
  certification_scope: CertificationProcessType[];
}

export interface StoreCertificationCasePayload {
  process_type: CertificationProcessType;
  attention_number?: string | null;
  case_number?: string | null;
  dte_type_code: string;
  description: string;
  notes?: string | null;
}

export interface EmitCertificationCaseItem {
  name: string;
  quantity: number;
  vr_unitary: number;
  is_exempt?: boolean;
  discount_pct?: number;
  unit_measure?: string;
}

/** Referencia a otro documento (usada para la marca 'SET' del Set de Pruebas). */
export interface EmitCertificationCaseReference {
  tipo_doc_ref?: string | null;
  folio_ref?: number | null;
  fecha_ref?: string | null;
  razon_ref?: string | null;
}

export interface EmitCertificationCasePayload {
  items: EmitCertificationCaseItem[];
  date?: string;
  payment_form?: number;
  description?: string;
  /** Descuento/recargo a nivel de todo el documento (<DscRcgGlobal>). */
  discount_surcharge?: { type: 'D' | 'R'; value_type: '%' | '$'; value: number } | null;
  /** Obligatorios en Nota de Crédito (61) / Nota de Débito (56): documento que corrige o anula. */
  reference_venta_id?: number | null;
  reference_cod_ref?: number | null;
  reference_razon?: string | null;
  type_note_credit_id?: number | null;
  type_note_debit_id?: number | null;
  /** Referencias adicionales sin CodRef (ej. la marca 'SET' del Set de Pruebas). */
  document_references?: EmitCertificationCaseReference[];
}

export interface PromoteToProductionPayload {
  resolution_num: string;
  resolution_date: string;
  notes?: string;
}

/**
 * Cliente HTTP del override administrativo SII del Portal de Soporte.
 * Espejo de SiiAdminController bajo v1/support/companies/{id}/sii.
 */
@Injectable({ providedIn: 'root' })
export class SiiAdminService {
  private _http = inject(HttpClient);

  private prefix(companyId: number): string {
    return `/api/v1/support/companies/${companyId}/sii`;
  }

  // --------------------------------------------------------------- Certificado

  getEnvironment(companyId: number): Observable<any> {
    return this._http.get<any>(`${this.prefix(companyId)}/environment`);
  }

  /**
   * Rollback de ambiente. La API rechaza con 422 el salto a producción: ese
   * camino es exclusivo de promoteToProduction().
   */
  rollbackToCertification(companyId: number, reason: string): Observable<unknown> {
    return this._http.patch(`${this.prefix(companyId)}/environment`, {
      sii_environment: 'certificacion',
      reason,
    });
  }

  getCertificate(companyId: number): Observable<any> {
    return this._http.get<any>(`${this.prefix(companyId)}/certificate`);
  }

  uploadCertificate(companyId: number, file: File, password: string): Observable<any> {
    const form = new FormData();
    form.append('certificate', file);
    form.append('password', password);
    return this._http.post<any>(`${this.prefix(companyId)}/certificate`, form);
  }

  deleteCertificate(companyId: number, id: number): Observable<any> {
    return this._http.delete<any>(`${this.prefix(companyId)}/certificate/${id}`);
  }

  testConnection(companyId: number): Observable<any> {
    return this._http.post<any>(`${this.prefix(companyId)}/certificate/test-connection`, {});
  }

  // --------------------------------------------------------------- CAF / Folios

  listCafs(companyId: number): Observable<any> {
    return this._http.get<any>(`${this.prefix(companyId)}/caf`);
  }

  uploadCaf(companyId: number, file: File): Observable<any> {
    const form = new FormData();
    form.append('caf', file);
    return this._http.post<any>(`${this.prefix(companyId)}/caf`, form);
  }

  // --------------------------------------------------------- Certificación (cross-tenant)

  getCertification(companyId: number): Observable<CertificationOverview> {
    return this._http
      .get<ApiEnvelope<CertificationOverview>>(`${this.prefix(companyId)}/certification`)
      .pipe(map((res) => res.data));
  }

  updateStep(
    companyId: number,
    payload: { process_type: CertificationProcessType; step_key: string; status: CertificationStepStatus; notes?: string | null },
  ): Observable<unknown> {
    return this._http.patch(`${this.prefix(companyId)}/certification/steps`, payload);
  }

  storeCase(companyId: number, payload: StoreCertificationCasePayload): Observable<CertificationCase> {
    return this._http
      .post<ApiEnvelope<CertificationCase>>(`${this.prefix(companyId)}/certification/cases`, payload)
      .pipe(map((res) => res.data));
  }

  updateCase(companyId: number, caseId: number, payload: Partial<StoreCertificationCasePayload> & { doc_sale_id?: number | null; doc_purchase_id?: number | null }): Observable<CertificationCase> {
    return this._http
      .patch<ApiEnvelope<CertificationCase>>(`${this.prefix(companyId)}/certification/cases/${caseId}`, payload)
      .pipe(map((res) => res.data));
  }

  deleteCase(companyId: number, caseId: number): Observable<unknown> {
    return this._http.delete(`${this.prefix(companyId)}/certification/cases/${caseId}`);
  }

  /**
   * Reenvía al SII un documento ya emitido, sin rehacerlo ni consumir folio.
   * Destraba los casos cuyo envío quedó a medias por una caída del SII.
   */
  resendCase(companyId: number, caseId: number): Observable<unknown> {
    return this._http.post(`${this.prefix(companyId)}/certification/cases/${caseId}/resend`, {});
  }

  sendLibroVentas(companyId: number): Observable<{ xml_base64: string; track_id?: string }> {
    return this._http.post<{ xml_base64: string; track_id?: string }>(`${this.prefix(companyId)}/certification/libro-ventas`, {});
  }

  /** 202: el documento se crea y el envío al SII queda encolado. */
  emitCase(companyId: number, caseId: number, payload: EmitCertificationCasePayload): Observable<unknown> {
    return this._http.post(`${this.prefix(companyId)}/certification/cases/${caseId}/emit`, payload);
  }

  /** Único camino al salto certificación → producción. */
  promoteToProduction(companyId: number, payload: PromoteToProductionPayload): Observable<SiiEnablementActa> {
    return this._http
      .post<ApiEnvelope<SiiEnablementActa>>(`${this.prefix(companyId)}/production`, payload)
      .pipe(map((res) => res.data));
  }

  updateOnboardingPath(companyId: number, path: SiiOnboardingPath): Observable<unknown> {
    return this._http.patch(`${this.prefix(companyId)}/onboarding-path`, { sii_onboarding_path: path });
  }

  updateCertificationScope(companyId: number, emitsBoleta: boolean): Observable<unknown> {
    return this._http.patch(`${this.prefix(companyId)}/certification-scope`, { sii_emits_boleta: emitsBoleta });
  }
}
