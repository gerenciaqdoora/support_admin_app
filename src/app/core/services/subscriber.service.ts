import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Suscriptor } from '../models/support.models';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

export interface ChangePlanPayload {
  plan_slug: string;
  reason: string;
  user_tier_code?: string;
  company_tier_code?: string;
  ends_at?: string;
}

export interface DimensionCapacity {
  tier: string | null;
  tier_max: number;
  addons: number;
  limit: number;
  usage: number;
  exceeds: boolean;
  aduana_capped?: boolean;
}

export interface QuantityAddon {
  id: number;
  dimension: 'users' | 'companies';
  quantity: number;
  reason: string | null;
  granted_by: string;
  valid_from: string;
  valid_until: string | null;
  revoked_at: string | null;
  revoked_reason: string | null;
}

export interface SubscriberCapacity {
  plan_id: number | null;
  users: DimensionCapacity;
  companies: DimensionCapacity;
  addons: QuantityAddon[];
}

export interface GrantAddonPayload {
  dimension: 'users' | 'companies';
  quantity: number;
  reason: string;
}

export interface ExtendPlanPayload {
  ends_at: string;
  reason: string;
}

export type ExpirationGroup = 'upcoming' | 'past_due' | 'suspended';

export interface ExpirationRow {
  subscriber_id: number;
  owner_name: string | null;
  owner_email: string | null;
  plan_name: string;
  status: string;
  ends_at: string | null;
  suspends_at: string | null;
  pending_cron: boolean;
}

export interface ExpirationPage {
  records: ExpirationRow[];
  pagination: { length: number; size: number; page: number; lastPage: number; startIndex: number; endIndex: number };
}

@Injectable({
  providedIn: 'root'
})
export class SubscriberService {
  private _http = inject(HttpClient);
  private readonly API_URL = '/api/v1/support/subscribers';

  // Signal para disparar búsquedas
  searchQuery = signal<string>('');

  // Angular 21/22+ rxResource usa 'params' y 'stream'
  private _subscribersResource = rxResource({
    params: () => this.searchQuery(),
    stream: ({ params: search }) => {
      const options = search ? { params: { search } } : {};
      return this._http.get<any>(this.API_URL, options);
    }
  });

  // Exponemos los estados derivados del resource
  subscribers = computed<Suscriptor[]>(() => {
    const res = this._subscribersResource.value() as any;
    return res?.data?.data || res?.data || [];
  });
  
  isLoading = this._subscribersResource.isLoading;

  getSubscriberById(id: number): Observable<any> {
    return this._http.get<any>(`${this.API_URL}/${id}`);
  }

  deleteSubscriber(id: number): Observable<any> {
    return this._http.delete<any>(`${this.API_URL}/${id}`);
  }

  reactivateSubscriber(id: number): Observable<any> {
    return this._http.post<any>(`${this.API_URL}/${id}/reactivate`, {});
  }

  changePlan(id: number, payload: ChangePlanPayload): Observable<any> {
    return this._http.post<any>(`${this.API_URL}/${id}/plan`, payload);
  }

  getCapacity(id: number): Observable<{ data: SubscriberCapacity }> {
    return this._http.get<{ data: SubscriberCapacity }>(`${this.API_URL}/${id}/capacity`);
  }

  grantAddon(id: number, payload: GrantAddonPayload): Observable<{ data: QuantityAddon }> {
    return this._http.post<{ data: QuantityAddon }>(`${this.API_URL}/${id}/addons`, payload);
  }

  revokeAddon(id: number, addonId: number, reason: string): Observable<{ data: QuantityAddon }> {
    return this._http.post<{ data: QuantityAddon }>(`${this.API_URL}/${id}/addons/${addonId}/revoke`, { reason });
  }

  extendPlan(id: number, payload: ExtendPlanPayload): Observable<unknown> {
    return this._http.post(`${this.API_URL}/${id}/plan/extend`, payload);
  }

  getExpirations(group: ExpirationGroup, page: number, size = 15, days = 7): Observable<{ data: ExpirationPage }> {
    return this._http.get<{ data: ExpirationPage }>('/api/v1/support/subscriptions/expirations', {
      params: { group, page, size, days },
    });
  }

  forcePasswordChange(subscriberId: number, userId: number): Observable<any> {
    return this._http.post<any>(`${this.API_URL}/${subscriberId}/users/${userId}/force-password-change`, {});
  }
}
