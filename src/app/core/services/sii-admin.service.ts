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

/**
 * Resolución SII de la empresa en un ambiente. Alimenta <FchResol>/<NroResol>
 * de la carátula de todo envío. No se deriva de la <FA> del CAF.
 */
export interface SiiCompanyResolution {
  id: number;
  company_id: number;
  environment: 'certificacion' | 'produccion';
  /** El backend lo castea a integer; 0 es un valor válido (certificación). */
  resolution_number: number;
  resolution_date: string;
  authorization_date: string | null;
}

export interface StoreResolutionPayload {
  environment: 'certificacion' | 'produccion';
  resolution_number: number;
  resolution_date: string;
  authorization_date: string | null;
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
  /** SET LIBRO DE GUIAS: solo se completan en casos con dte_type_code '52'. */
  guide_book_anulado?: number | null;
  guide_book_ref_type?: string | null;
  guide_book_ref_folio?: number | null;
  guide_book_ref_date?: string | null;
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

/** Bloque de traslado de la Guía de Despacho (52): IdDoc + sección Transporte. */
export interface EmitCertificationCaseDispatch {
  tipo_despacho: number | null;
  ind_traslado: number | null;
  patente?: string | null;
  rut_transporte?: string | null;
  rut_chofer?: string | null;
  nombre_chofer?: string | null;
  dir_dest?: string | null;
  comuna_dest?: string | null;
  ciudad_dest?: string | null;
}

/**
 * Bloque de exportación del DTE 110/111/112: Receptor extranjero + Aduana +
 * OtraMoneda. Espejo exacto de `EmitDteRequest` (Portal Cliente) — mismo
 * contrato que persiste `ElectronicDocumentService::persistExportDetail()`.
 */
export interface EmitCertificationCaseExport {
  tpo_moneda: string;
  tpo_cambio: number;
  /** Forma de pago del importador extranjero (tabla Formas de Pago de Aduanas). */
  fma_pag_exp?: number | null;
  /**
   * Fecha de cancelación del documento (Y-m-d). El backend la exige cuando
   * `fma_pag_exp` es 32 (anticipo): el SII rechaza el DTE sin ella.
   */
  fch_cancel?: string | null;
  /**
   * Clasifica solo operaciones de SERVICIOS: 3 = calificado por Aduana ·
   * 4 = hotelería · 5 = transporte terrestre internacional · 6 = servicios
   * prestados y utilizados totalmente en el extranjero. No existe código para
   * "venta de bienes" — una exportación de bienes físicos omite el campo (null).
   */
  ind_servicio?: number | null;
  recep_num_id?: string | null;
  recep_nacionalidad?: number | null;
  cod_mod_venta?: number | null;
  cod_clau_venta?: number | null;
  tot_clau_venta?: number | null;
  cod_via_transp?: number | null;
  nombre_transp?: string | null;
  rut_cia_transp?: string | null;
  nom_cia_transp?: string | null;
  cod_pto_embarque?: number | null;
  cod_pto_desemb?: number | null;
  tara?: number | null;
  cod_unid_med_tara?: number | null;
  peso_bruto?: number | null;
  cod_unid_peso_bruto?: number | null;
  peso_neto?: number | null;
  cod_unid_peso_neto?: number | null;
  tot_bultos?: number | null;
  cod_tpo_bultos?: number | null;
  cant_bultos?: number | null;
  mnt_flete?: number | null;
  mnt_seguro?: number | null;
  cod_pais_recep?: number | null;
  cod_pais_destin?: number | null;
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
  /**
   * Compra que esta Nota de Crédito/Débito corrige o anula (DTE 61/56 emitidos
   * sobre una Factura de Compra 46). Excluyente con reference_venta_id: el
   * receptor del DTE es el proveedor, no un cliente.
   */
  reference_purchase_id?: number | null;
  reference_cod_ref?: number | null;
  reference_razon?: string | null;
  type_note_credit_id?: number | null;
  type_note_debit_id?: number | null;
  /** Referencias adicionales sin CodRef (ej. la marca 'SET' del Set de Pruebas). */
  document_references?: EmitCertificationCaseReference[];
  /** Solo Guía de Despacho (52). El Set de Pruebas exige siempre ind_traslado. */
  dispatch?: EmitCertificationCaseDispatch;
  /** Solo Factura/Nota de Exportación (110/111/112). */
  export?: EmitCertificationCaseExport;
}

export interface PromoteToProductionPayload {
  resolution_num: string;
  resolution_date: string;
  notes?: string;
}

export interface CertificationPurchaseLine {
  id: number;
  doc_tributary_code: string;
  folio: number;
  counterparty_rut: string;
  counterparty_name: string;
  doc_date: string;
  amount_exempt: number;
  amount_net: number;
  nature: 'normal' | 'iva_uso_comun' | 'entrega_gratuita' | 'retencion_total';
  // Eloquent castea esta columna como decimal:3, que Laravel serializa como
  // string en el JSON de lectura — a diferencia del payload de escritura, que
  // manda un número (ver StorePurchaseLinePayload).
  proportionality_factor: string | null;
  observations: string | null;
}

export interface StorePurchaseLinePayload {
  doc_tributary_code: string;
  folio: number;
  counterparty_rut: string;
  counterparty_name: string;
  doc_date: string;
  amount_exempt: number;
  amount_net: number;
  nature: 'normal' | 'iva_uso_comun' | 'entrega_gratuita' | 'retencion_total';
  proportionality_factor: number | null;
  observations: string | null;
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

  updateCase(
    companyId: number,
    caseId: number,
    payload: Partial<StoreCertificationCasePayload> & {
      doc_sale_id?: number | null;
      doc_purchase_id?: number | null;
      guide_book_anulado?: number | null;
      guide_book_ref_type?: string | null;
      guide_book_ref_folio?: number | null;
      guide_book_ref_date?: string | null;
    },
  ): Observable<CertificationCase> {
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
  resendCase(companyId: number, caseId: number, rebuild = false): Observable<unknown> {
    return this._http.post(`${this.prefix(companyId)}/certification/cases/${caseId}/resend`, { rebuild });
  }

  /** Construye, firma y envía el Libro de Ventas de certificación; incluye el XML en base64 para descarga. */
  sendLibroVentas(companyId: number): Observable<{
    status: string | null;
    glosa: string | null;
    track_id: string | null;
    period: string;
    xml_base64: string;
  }> {
    return this._http
      .post<
        ApiEnvelope<{
          status: string | null;
          glosa: string | null;
          track_id: string | null;
          period: string;
          xml_base64: string;
        }>
      >(`${this.prefix(companyId)}/certification/libro-ventas`, {})
      .pipe(map((res) => res.data));
  }

  listPurchaseLines(companyId: number): Observable<CertificationPurchaseLine[]> {
    return this._http
      .get<ApiEnvelope<CertificationPurchaseLine[]>>(`${this.prefix(companyId)}/certification/purchase-lines`)
      .pipe(map((res) => res.data));
  }

  storePurchaseLine(companyId: number, payload: StorePurchaseLinePayload): Observable<CertificationPurchaseLine> {
    return this._http
      .post<ApiEnvelope<CertificationPurchaseLine>>(`${this.prefix(companyId)}/certification/purchase-lines`, payload)
      .pipe(map((res) => res.data));
  }

  deletePurchaseLine(companyId: number, lineId: number): Observable<unknown> {
    return this._http.delete(`${this.prefix(companyId)}/certification/purchase-lines/${lineId}`);
  }

  /** Construye, firma y envía el Libro de Compras de certificación. */
  sendLibroCompras(companyId: number): Observable<{
    status: string | null;
    glosa: string | null;
    track_id: string | null;
    period: string;
    xml_base64: string;
  }> {
    return this._http
      .post<
        ApiEnvelope<{
          status: string | null;
          glosa: string | null;
          track_id: string | null;
          period: string;
          xml_base64: string;
        }>
      >(`${this.prefix(companyId)}/certification/libro-compras`, {})
      .pipe(map((res) => res.data));
  }

  /**
   * Construye, firma y envía el Libro de Guías de certificación. El folio de
   * notificación es obligatorio: el servidor nunca lo deriva ni lo adivina.
   */
  sendLibroGuias(
    companyId: number,
    folioNotificacion: number,
  ): Observable<{
    status: string | null;
    glosa: string | null;
    track_id: string | null;
    period: string;
    xml_base64: string;
  }> {
    return this._http
      .post<
        ApiEnvelope<{
          status: string | null;
          glosa: string | null;
          track_id: string | null;
          period: string;
          xml_base64: string;
        }>
      >(`${this.prefix(companyId)}/certification/libro-guias`, { folio_notificacion: folioNotificacion })
      .pipe(map((res) => res.data));
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

  listResolutions(companyId: number): Observable<SiiCompanyResolution[]> {
    return this._http
      .get<ApiEnvelope<SiiCompanyResolution[]>>(`${this.prefix(companyId)}/sii-resolutions`)
      .pipe(map((res) => res.data));
  }

  storeResolution(companyId: number, payload: StoreResolutionPayload): Observable<SiiCompanyResolution> {
    return this._http
      .post<ApiEnvelope<SiiCompanyResolution>>(`${this.prefix(companyId)}/sii-resolutions`, payload)
      .pipe(map((res) => res.data));
  }
}
