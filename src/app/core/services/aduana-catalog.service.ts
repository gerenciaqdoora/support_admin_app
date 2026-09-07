import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

/**
 * Ítem de catálogo Anexo 51 de Aduana (AduanaCatalogService::getX() en el
 * backend). El campo de texto a mostrar varía por catálogo — verificado
 * contra los `select()` reales del backend, no asumido:
 * país/puerto → `name`; vía de transporte/incoterm/moneda → `label`.
 * `code` viaja como el backend lo persiste (no está forzado a integer por
 * cast); el DTE de exportación lo exige numérico salvo en moneda, donde usa
 * el propio `label` como texto (`tpo_moneda`).
 */
export interface AduanaCatalogItem {
  id: string | number;
  code: string;
  name?: string;
  label?: string;
  /**
   * Solo moneda: varias filas comparten `label` genérico (ej. 7 filas
   * "DÓLAR" — USA/CAN/HK/NZ/AUST/TAI/SIN) y se distinguen únicamente por esta
   * descripción ("DÓLAR USA"). Es el valor que exige `tpo_moneda` — usar
   * `label` ahí es ambiguo y no corresponde al texto real del catálogo SII.
   */
  description?: string;
}

/**
 * Catálogos Anexo 51 (país/puerto/moneda/vía/incoterm) que alimentan el DTE
 * de Exportación (110/111/112). Mismos endpoints que ya usa el Portal Cliente
 * en `app/api/aduana/catalogs.api.ts` — son de solo lectura, sin datos
 * sensibles de la empresa (GetContextRequest::authorize() siempre true), así
 * que Soporte los consume directo sin necesitar un espejo propio en backend.
 */
@Injectable({ providedIn: 'root' })
export class AduanaCatalogService {
  private _http = inject(HttpClient);

  private prefix(companyId: number): string {
    return `/api/v1/company/${companyId}/aduana`;
  }

  private list(companyId: number, path: string): Observable<AduanaCatalogItem[]> {
    // GetContextRequest::prepareForValidation() convierte la ausencia de
    // 'active' en null, lo que pisa el default true de $request->boolean() en
    // el controlador y filtra TODO el catálogo (queda active=false) — hay que
    // mandarlo explícito, igual que ya hace el Portal Cliente.
    const params = new HttpParams().set('active', 'true');

    return this._http
      .get<{ data: AduanaCatalogItem[] }>(`${this.prefix(companyId)}/${path}`, { params })
      .pipe(map((res) => res.data ?? []));
  }

  getCurrencies(companyId: number): Observable<AduanaCatalogItem[]> {
    return this.list(companyId, 'currencies');
  }

  getCountries(companyId: number): Observable<AduanaCatalogItem[]> {
    return this.list(companyId, 'countries');
  }

  getPorts(companyId: number): Observable<AduanaCatalogItem[]> {
    return this.list(companyId, 'ports');
  }

  getTransportModes(companyId: number): Observable<AduanaCatalogItem[]> {
    return this.list(companyId, 'transport-modes');
  }

  getIncoterms(companyId: number): Observable<AduanaCatalogItem[]> {
    return this.list(companyId, 'incoterms');
  }

  /** Formas de pago de exportación (<FmaPagExp>): ANTICIPO, COBRANZA, ACRED… */
  getPaymentMethods(companyId: number): Observable<AduanaCatalogItem[]> {
    return this.list(companyId, 'payment-methods');
  }

  /** Tipos de bulto (<CodTpoBultos>): PLANCHAS, PALLETS, CAJAS… */
  getPackageTypes(companyId: number): Observable<AduanaCatalogItem[]> {
    return this.list(companyId, 'package-types');
  }
}
