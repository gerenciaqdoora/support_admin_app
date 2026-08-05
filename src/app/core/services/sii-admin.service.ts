import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
 * Solicitud de habilitación de producción SII (espejo de
 * EnablementRequestResource). Cola cross-tenant revisada por Soporte.
 */
export interface SiiEnablementRequest {
  id: number;
  company_id: number;
  company_name: string | null;
  status: 'pending' | 'approved' | 'rejected';
  requested_by: number;
  requested_at: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  resolution_num: string | null;
  resolution_date: string | null;
  notes: string | null;
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

  updateEnvironment(companyId: number, environment: string): Observable<any> {
    return this._http.patch<any>(`${this.prefix(companyId)}/environment`, { sii_environment: environment });
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

  // --------------------------------------------------------- Habilitación (cross-tenant)

  listEnablementRequests(status: string = 'pending'): Observable<any> {
    return this._http.get<any>(`/api/v1/support/sii/enablement-requests`, { params: { status } });
  }

  approveEnablement(id: number): Observable<any> {
    return this._http.post<any>(`/api/v1/support/sii/enablement-requests/${id}/approve`, {});
  }

  rejectEnablement(id: number, reason: string): Observable<any> {
    return this._http.post<any>(`/api/v1/support/sii/enablement-requests/${id}/reject`, { reason });
  }
}
