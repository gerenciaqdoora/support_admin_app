import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LogUser {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface LoggerData {
  id: number;
  user_id: number;
  type: string;
  operation: string;
  event: string;
  date: string;
  uri: string;
  long_text: string;
  evidence: any;
  type_exception: string | null;
  exception: string | null;
  usuario: LogUser | null;
}

export interface PaginatedLogs {
  data: LoggerData[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface LogResponse {
  data: PaginatedLogs;
  message: string;
  status: boolean;
}

export interface ChartStat {
  label: string;
  total: number;
}

export interface StatsResponse {
  data: ChartStat[];
  message: string;
  status: boolean;
}

export interface UsersResponse {
  data: LogUser[];
  message: string;
  status: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private _http = inject(HttpClient);

  getLogs(filters: any, page: number = 1): Observable<LogResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', (filters.per_page || 10).toString());
    
    if (filters.period) params = params.set('period', filters.period);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.event) params = params.set('event', filters.event);
    if (filters.user_id) params = params.set('user_id', filters.user_id.toString());
    if (filters.date_start) params = params.set('date_start', filters.date_start);
    if (filters.date_end) params = params.set('date_end', filters.date_end);

    return this._http.get<LogResponse>('/v1/support/logs', { params });
  }

  getStats(filters: any): Observable<StatsResponse> {
    let params = new HttpParams();
    if (filters.period) params = params.set('period', filters.period);
    if (filters.type) params = params.set('type', filters.type);
    if (filters.event) params = params.set('event', filters.event);
    if (filters.user_id) params = params.set('user_id', filters.user_id.toString());
    if (filters.date_start) params = params.set('date_start', filters.date_start);
    if (filters.date_end) params = params.set('date_end', filters.date_end);

    return this._http.get<StatsResponse>('/v1/support/logs/stats', { params });
  }

  getUsers(): Observable<UsersResponse> {
    return this._http.get<UsersResponse>('/v1/support/logs/users');
  }
}
