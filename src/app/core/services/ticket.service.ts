import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Ticket, TicketInteraction, TicketStatus } from '../models/support.models';
import { Observable, tap, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private _http = inject(HttpClient);
  private readonly API_URL = 'http://localhost/api/v1/support';

  // Signal para la lista de tickets actual
  tickets = signal<Ticket[]>([]);
  isLoading = signal<boolean>(false);

  // Almacenamiento temporal para simulación (Persiste durante la sesión del navegador)
  private simulatedInteractions = new Map<number, any[]>();
  private simulatedTraceability = new Map<number, any[]>();

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
    return this._http.get<Ticket>(`${this.API_URL}/tickets/${id}`).pipe(
      map(ticket => {
        const extraInteractions = this.simulatedInteractions.get(id) || [];
        const extraTraceability = this.simulatedTraceability.get(id) || [];
        
        return {
          ...ticket,
          interactions: [...extraInteractions, ...(ticket.interactions || [])],
          traceability: [...extraTraceability, ...(ticket.traceability || [])]
        };
      })
    );
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

  addInteraction(id: number, message: string, isInternal: boolean = false, newStatus?: string): Observable<TicketInteraction> {
    return this._http.post<any>(`${this.API_URL}/tickets/${id}/interactions`, { 
      message, 
      is_internal: isInternal,
      status: newStatus 
    }).pipe(
      map(res => res.interaction)
    );
  }

  // MOCK CHAT METHODS
  getChatStatus(ticketId: number): Observable<{status: string}> {
    // Simulating API call
    return new Observable(observer => {
      observer.next({ status: 'REQUESTED' });
      observer.complete();
    });
  }

  updateChatStatus(ticketId: number, status: string): Observable<any> {
    return this._http.patch<any>(`${this.API_URL}/tickets/${ticketId}/chat-status`, { status });
  }

  addForensicLog(ticketId: number, event: string, label: string, description: string): Observable<any> {
    // Mocking forensic log addition
    return new Observable(observer => {
      observer.next({ success: true });
      observer.complete();
    });
  }

  // Helpers para persistencia de simulación
  addSimulatedInteraction(ticketId: number, interaction: any) {
    const current = this.simulatedInteractions.get(ticketId) || [];
    this.simulatedInteractions.set(ticketId, [interaction, ...current]);
  }

  addSimulatedTraceability(ticketId: number, log: any) {
    const current = this.simulatedTraceability.get(ticketId) || [];
    this.simulatedTraceability.set(ticketId, [log, ...current]);
  }
}
