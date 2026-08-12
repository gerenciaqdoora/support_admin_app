import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Ticket, TicketInteraction, TicketStatus } from '../models/support.models';
import { Observable, tap, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private _http = inject(HttpClient);
  private readonly API_URL = '/api/v1/support';

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
    return this._http.post<any>(`${this.API_URL}/tickets`, ticket).pipe(
      tap(res => {
        // Al crear uno nuevo, refrescamos la lista automáticamente
        this.getTickets().subscribe();
      }),
      // Transformamos la respuesta para retornar solo el objeto ticket
      map(res => res.ticket)
    );
  }

  updateStatus(id: number, status: TicketStatus, description?: string, solution?: string): Observable<any> {
    return this._http.patch<any>(`${this.API_URL}/tickets/${id}/status`, { status, description, solution }).pipe(
      map(res => res.ticket)
    );
  }

  assignTicket(id: number): Observable<any> {
    return this._http.patch<any>(`${this.API_URL}/tickets/${id}/assign`, {}).pipe(
      map(res => res.ticket)
    );
  }

  addInteraction(id: number, message: string, newStatus?: string): Observable<TicketInteraction> {
    return this._http.post<any>(`${this.API_URL}/tickets/${id}/interactions`, {
      message,
      status: newStatus
    }).pipe(
      map(res => res.interaction)
    );
  }
}
