import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface AnalyticsDashboard {
  status_distribution: Record<string, number>;
  priority_distribution: Record<string, number>;
  volume_over_time: {
    labels: string[];
    series: number[];
  };
  sla_metrics: {
    avg_first_response_hours: number;
    avg_resolution_hours: number;
    total_open_overdue: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private _http = inject(HttpClient);
  private readonly API_URL = 'http://localhost/api/v1/support/analytics';

  dashboardData = signal<AnalyticsDashboard | null>(null);
  isLoading = signal<boolean>(false);

  getDashboardData(): Observable<any> {
    this.isLoading.set(true);
    return this._http.get<any>(this.API_URL).pipe(
      tap(res => {
        this.dashboardData.set(res.data);
        this.isLoading.set(false);
      })
    );
  }
}
