import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

export interface PlanModule {
  id?: number;
  code: string;
  name?: string;
  pivot?: {
    included: boolean;
    addon_price: string;
  };
}

export interface Plan {
  id: number;
  slug: string;
  name: string;
  tier: string;
  target: string;
  currency: string;
  base_price: string;
  base_user_quantity: number;
  base_company_quantity: number;
  is_public: boolean;
  active: boolean;
  deprecated_at: string | null;
  notes: string | null;
  modules?: PlanModule[];
}

export interface CreatePlanPayload {
  slug: string;
  name: string;
  tier: string;
  target: string;
  currency: string;
  base_price: number;
  base_user_quantity: number;
  base_company_quantity: number;
  is_public: boolean;
  active: boolean;
  notes?: string;
  modules: {
    module_code: string;
    included: boolean;
    addon_price?: number;
  }[];
}

export interface UpdatePlanPayload {
  name?: string;
  tier?: string;
  target?: string;
  currency?: string;
  base_price?: number;
  base_user_quantity?: number;
  base_company_quantity?: number;
  is_public?: boolean;
  active?: boolean;
  notes?: string;
}

export interface DiscountCode {
  id: number;
  code: string;
  type: string;
  value: string;
  max_uses: number | null;
  used_count: number;
  active: boolean;
  expires_at: string | null;
}

export interface CreateDiscountCodePayload {
  code: string;
  type: string; // Ej: 'PERCENTAGE', 'FIXED'
  value: number;
  max_uses?: number;
  active: boolean;
  expires_at?: string;
}

export interface DeprecatePlanPayload {
  reason: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlanManagerService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/v1/support/plans`;
  private modulesUrl = `${environment.apiUrl}/v1/support/modules`;

  getPlans(): Observable<{ data: { plans: Plan[] } }> {
    return this.http.get<{ data: { plans: Plan[] } }>(this.apiUrl);
  }

  /**
   * Planes vigentes que incluyen el módulo Aduana.
   * Sólo el alta de Suscriptores Aduana puede contratarlos.
   */
  getCustomsPlans(): Observable<{ data: { plans: Plan[] } }> {
    return this.http.get<{ data: { plans: Plan[] } }>(`${this.apiUrl}/customs`);
  }

  getModules(): Observable<{ data: { code: string; name: string; is_core: boolean }[] }> {
    return this.http.get<{ data: { code: string; name: string; is_core: boolean }[] }>(this.modulesUrl);
  }

  createPlan(payload: CreatePlanPayload): Observable<{ data: { plan: Plan }; message: string }> {
    return this.http.post<{ data: { plan: Plan }; message: string }>(this.apiUrl, payload);
  }

  updatePlan(id: number, payload: UpdatePlanPayload): Observable<{ data: { plan: Plan }; message: string }> {
    return this.http.put<{ data: { plan: Plan }; message: string }>(`${this.apiUrl}/${id}`, payload);
  }

  deprecatePlan(id: number, payload: DeprecatePlanPayload): Observable<{ data: { plan: Plan }; message: string }> {
    return this.http.patch<{ data: { plan: Plan }; message: string }>(`${this.apiUrl}/${id}/deprecate`, payload);
  }

  createDiscountCode(payload: CreateDiscountCodePayload): Observable<{ data: { discount: DiscountCode }; message: string }> {
    return this.http.post<{ data: { discount: DiscountCode }; message: string }>(`${this.apiUrl}/discount-codes`, payload);
  }
}
