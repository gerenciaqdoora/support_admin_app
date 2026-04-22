import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Ticket, TicketInteraction, TicketStatus } from '../models/support.models';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private _http = inject(HttpClient);
  private readonly API_URL = 'http://localhost/api/v1/support';

  // Signal para la lista de tickets actual
  tickets = signal<Ticket[]>([]);
  isLoading = signal<boolean>(false);

  getTickets(): Observable<any> {
    this.isLoading.set(true);
    return this._http.get<any>(`${this.API_URL}/tickets`).pipe(
      tap(res => {
        this.tickets.set(res.data || res);
        this.isLoading.set(false);
      })
    );
  }

  getTicketById(id: number): Observable<Ticket> {
    return this._http.get<Ticket>(`${this.API_URL}/tickets/${id}`);
  }

  createTicket(ticket: Partial<Ticket>): Observable<Ticket> {
    return this._http.post<Ticket>(`${this.API_URL}/tickets`, ticket);
  }

  updateStatus(id: number, status: TicketStatus, description?: string): Observable<any> {
    return this._http.patch(`${this.API_URL}/tickets/${id}/status`, { status, description });
  }

  addInteraction(id: number, message: string, isInternal: boolean = false): Observable<TicketInteraction> {
    return this._http.post<TicketInteraction>(`${this.API_URL}/tickets/${id}/interactions`, { message, is_internal: isInternal });
  }
}
