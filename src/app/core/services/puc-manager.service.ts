import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FormGroup } from '@angular/forms';
import { SubTipo, Cuenta, SubCuenta } from '../models/data/accountPlan';

@Injectable({
  providedIn: 'root'
})
export class PucManagerService {
  private _http = inject(HttpClient);
  private readonly API_URL = '/api/v1/support/puc';

  getPUC(): Observable<any> {
    return this._http.get<any>(this.API_URL);
  }

  createSubTipo(data: Partial<SubTipo>): Observable<any> {
    return this._http.post<any>(`${this.API_URL}/subtype`, data);
  }

  updateSubTipo(id: number, data: Partial<SubTipo>): Observable<any> {
    return this._http.put<any>(`${this.API_URL}/subtype/${id}`, data);
  }

  deleteSubTipo(id: number): Observable<any> {
    return this._http.delete<any>(`${this.API_URL}/subtype/${id}`);
  }

  createCuenta(data: Partial<Cuenta>): Observable<any> {
    return this._http.post<any>(`${this.API_URL}/account`, data);
  }

  updateCuenta(id: number, data: Partial<Cuenta>): Observable<any> {
    return this._http.put<any>(`${this.API_URL}/account/${id}`, data);
  }

  deleteCuenta(id: number): Observable<any> {
    return this._http.delete<any>(`${this.API_URL}/account/${id}`);
  }

  createSubCuenta(data: Partial<SubCuenta>): Observable<any> {
    return this._http.post<any>(`${this.API_URL}/subaccount`, data);
  }

  updateSubCuenta(id: number, data: Partial<SubCuenta>): Observable<any> {
    return this._http.put<any>(`${this.API_URL}/subaccount/${id}`, data);
  }

  deleteSubCuenta(id: number): Observable<any> {
    return this._http.delete<any>(`${this.API_URL}/subaccount/${id}`);
  }

  // Gets
  getCuenta(id: number): Observable<Cuenta> {
      return this._http.get<Cuenta>(`${this.API_URL}/account/${id}`);
  }

  getSubTipo(id: number): Observable<SubTipo> {
      return this._http.get<SubTipo>(`${this.API_URL}/subtype/${id}`);
  }

  getSubCuenta(id: number): Observable<SubCuenta> {
      return this._http.get<SubCuenta>(`${this.API_URL}/subaccount/${id}`);
  }

  getSubTiposPorTipo(id: number): Observable<SubTipo[]> {
      return this._http.get<SubTipo[]>(`${this.API_URL}/type/${id}/subtypes`);
  }

  getCuentasPorSubTipo(id: number): Observable<Cuenta[]> {
      return this._http.get<Cuenta[]>(`${this.API_URL}/subtype/${id}/accounts`);
  }

  getSubCuentasPorCuenta(id: number): Observable<SubCuenta[]> {
      return this._http.get<SubCuenta[]>(`${this.API_URL}/account/${id}/subaccounts`);
  }

  getAsociacionCategoriaCuenta(planId: number, categoryId: number): Observable<any> {
      return this._http.get<any>(`${this.API_URL}/${planId}/category-association/${categoryId}`);
  }

  // Helpers de resumen de configuraciones usados por los dialogos
  getResumenOperativa(form: FormGroup): string {
      if (!form) return '';
      const activos: string[] = [];

      if (form.get('trabaja_con_auxiliar_con_rut')?.value) activos.push('Aux con RUT');
      if (form.get('trabaja_con_auxiliar')?.value) activos.push('Aux sin RUT');
      if (form.get('trabaja_con_centro_costo')?.value) activos.push('Centro Costos');
      if (form.get('trabaja_con_numero_operacion')?.value) activos.push('N° Operación');
      if (form.get('trabaja_con_numero_despacho')?.value) activos.push('N° Despacho');

      return activos.length ? activos.join(' · ') : 'Sin configuraciones';
  }

  getResumenTesoreria(form: FormGroup): string {
      if (!form) return '';
      const activos: string[] = [];

      if (form.get('show_in_treasury')?.value) {
          const type = form.get('treasury_type')?.value;
          if (type === 'bank') activos.push('Es banco');
          else if (type === 'cash_box') activos.push('Es caja');
          else if (type === 'receivable_payable') activos.push('Es cuenta a pagar/cobrar');
      }

      return activos.length ? activos.join(' · ') : 'Sin configuraciones';
  }

  getResumenIfrs(form: FormGroup): string {
      if (!form) return '';
      const cuenta = form.get('ifrs_account')?.value;
      return cuenta?.code ? `${cuenta.code} | ${cuenta.name}` : 'Sin configuraciones';
  }

  getResumenCuentaMaestra(form: FormGroup): string {
      if (!form) return '';
      const cuenta = form.get('cuenta_maestra')?.value;
      return cuenta?.name ? `${cuenta.name}` : 'Sin configuraciones';
  }
}
