import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Suscriptor } from '../models/support.models';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

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
}
