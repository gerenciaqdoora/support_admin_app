import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HelpCategory, HelpArticle } from '../models/support.models';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HelpCenterService {
  private _http = inject(HttpClient);
  private readonly API_URL = 'http://localhost/api/v1/support/help-center';

  // Signals para parámetros
  searchQuery = signal<string>('');

  // Resource para Categorías
  private _categoriesResource = rxResource({
    stream: () => this._http.get<any>(`${this.API_URL}/categories`)
  });

  // Resource para Búsqueda Global
  private _searchResource = rxResource({
    params: () => this.searchQuery(),
    stream: ({ params: query }) => {
      const options = query ? { params: { q: query } } : {};
      return this._http.get<any>(`${this.API_URL}/search`, options);
    }
  });

  // Computed states
  categories = computed<HelpCategory[]>(() => {
    const res = this._categoriesResource.value() as any;
    return res?.data || [];
  });
  
  searchResults = computed<HelpArticle[]>(() => {
    const res = this._searchResource.value() as any;
    return res?.data || [];
  });

  isSearching = computed(() => this._searchResource.isLoading() && this.searchQuery().length > 0);

  // Funciones manuales para vistas de detalle
  getCategoryArticles(slug: string): Observable<any> {
    return this._http.get<any>(`${this.API_URL}/categories/${slug}`);
  }

  getArticle(slug: string): Observable<any> {
    return this._http.get<any>(`${this.API_URL}/articles/${slug}`);
  }

  createArticle(data: any): Observable<any> {
    return this._http.post<any>(`${this.API_URL}/articles`, data);
  }
}
