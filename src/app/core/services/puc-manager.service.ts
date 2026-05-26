import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
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

  getAccountPlanDataFull(): Observable<any> {
    return this._http.get<any>(this.API_URL).pipe(
      map((response: any) => response.data.record)
    );
  }

  getAccountCategories(): Observable<any> {
    return this._http.get<any>('/api/v1/account/plan/category/account').pipe(
      map((response: any) => response.data.record)
    );
  }

  getIfrsAccount(): Observable<any> {
    return this._http.get<any>('/api/v1/account/plan/detail/ifrs/accounts').pipe(
      map((response: any) => response.data.record)
    );
  }

  createSubTipo(data: Partial<SubTipo>): Observable<SubTipo> {
    return this._http.post<any>(`${this.API_URL}/subtype`, data).pipe(
        map(response => response.data.newRecord)
    );
  }

  updateSubTipo(id: number, data: Partial<SubTipo>): Observable<SubTipo> {
    return this._http.put<any>(`${this.API_URL}/subtype/${id}`, data).pipe(
        map(response => response.data.record)
    );
  }

  deleteSubTipo(id: number): Observable<SubTipo> {
    return this._http.delete<any>(`${this.API_URL}/subtype/${id}`).pipe(
        map(response => response.data.record)
    );
  }

  createCuenta(data: Partial<Cuenta>): Observable<Cuenta> {
    return this._http.post<any>(`${this.API_URL}/account`, data).pipe(
        map(response => response.data.newRecord)
    );
  }

  updateCuenta(id: number, data: Partial<Cuenta>): Observable<Cuenta> {
    return this._http.put<any>(`${this.API_URL}/account/${id}`, data).pipe(
        map(response => response.data.record)
    );
  }

  deleteCuenta(id: number): Observable<Cuenta> {
    return this._http.delete<any>(`${this.API_URL}/account/${id}`).pipe(
        map(response => response.data.record)
    );
  }

  createSubCuenta(data: Partial<SubCuenta>): Observable<SubCuenta> {
    return this._http.post<any>(`${this.API_URL}/subaccount`, data).pipe(
        map(response => response.data.newRecord)
    );
  }

  updateSubCuenta(id: number, data: Partial<SubCuenta>): Observable<SubCuenta> {
    return this._http.put<any>(`${this.API_URL}/subaccount/${id}`, data).pipe(
        map(response => response.data.record)
    );
  }

  deleteSubCuenta(id: number): Observable<SubCuenta> {
    return this._http.delete<any>(`${this.API_URL}/subaccount/${id}`).pipe(
        map(response => response.data.record)
    );
  }

  // Gets
  getCuenta(id: number): Observable<Cuenta> {
      return this._http.get<any>(`${this.API_URL}/account/${id}`).pipe(
          map(response => response.data.record)
      );
  }

  getSubTipo(id: number): Observable<SubTipo> {
      return this._http.get<any>(`${this.API_URL}/subtype/${id}`).pipe(
          map(response => response.data.record)
      );
  }

  getSubCuenta(id: number): Observable<SubCuenta> {
      return this._http.get<any>(`${this.API_URL}/subaccount/${id}`).pipe(
          map(response => response.data.record)
      );
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
