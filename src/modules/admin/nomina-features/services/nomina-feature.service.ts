import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  GlobalNominaFeature,
  ToggleNominaFeaturePayload,
} from '../models/nomina-feature.interface';

@Injectable({
  providedIn: 'root',
})
export class NominaFeatureService {
  private readonly _http = inject(HttpClient);
  private readonly _apiUrl = '/v1/support/nomina-features';

  // Signals for state management
  readonly features = signal<GlobalNominaFeature[]>([]);
  readonly loading = signal<boolean>(false);

  /**
   * Obtiene la lista de features desde el backend
   */
  getFeatures(): Observable<{ data: GlobalNominaFeature[] }> {
    this.loading.set(true);
    return this._http.get<{ data: GlobalNominaFeature[] }>(this._apiUrl).pipe(
      tap({
        next: (response) => {
          this.features.set(response.data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      }),
    );
  }

  /**
   * Cambia el estado global de una característica
   */
  toggleFeature(
    featureKey: string,
    payload: ToggleNominaFeaturePayload,
  ): Observable<{ data: GlobalNominaFeature }> {
    return this._http
      .patch<{ data: GlobalNominaFeature }>(`${this._apiUrl}/${featureKey}/toggle`, payload)
      .pipe(tap((response) => this._updateFeatureInSignal(response.data)));
  }


  private _updateFeatureInSignal(updatedFeature: GlobalNominaFeature): void {
    this.features.update((current) =>
      current.map((feature) =>
        feature.feature_key === updatedFeature.feature_key ? updatedFeature : feature,
      ),
    );
  }
}
