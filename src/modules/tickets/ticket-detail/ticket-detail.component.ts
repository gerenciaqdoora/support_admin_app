import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { TicketService } from '@core/services/ticket.service';
import { AuthService } from '@core/services/auth.service';
import { Ticket, TicketStatus } from '@core/models/support.models';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex flex-col h-full bg-white">
      @if (ticket()) {
        <!-- Stepper de Progreso (Chevron Style) -->
        <div class="px-8 py-4 bg-slate-50 border-b border-slate-100 shrink-0">
          <div class="flex items-center gap-1">
            <div [class.bg-blue-600]="ticket()?.status === status.OPEN || ticket()?.status === status.IN_PROGRESS || ticket()?.status === status.RESOLVED || ticket()?.status === status.CLOSED"
                 [class.text-white]="ticket()?.status === status.OPEN || ticket()?.status === status.IN_PROGRESS || ticket()?.status === status.RESOLVED || ticket()?.status === status.CLOSED"
                 class="flex-1 flex items-center justify-center gap-2 py-2 rounded-l-xl text-[9px] font-black uppercase tracking-widest transition-all">
              <span>1. Recepción</span>
              <span *ngIf="ticket()?.status !== status.OPEN">✅</span>
            </div>
            <div [class.bg-blue-600]="ticket()?.status === status.IN_PROGRESS || ticket()?.status === status.RESOLVED || ticket()?.status === status.CLOSED"
                 [class.text-white]="ticket()?.status === status.IN_PROGRESS || ticket()?.status === status.RESOLVED || ticket()?.status === status.CLOSED"
                 [class.bg-slate-200]="ticket()?.status === status.OPEN"
                 [class.text-slate-400]="ticket()?.status === status.OPEN"
                 class="flex-1 flex items-center justify-center gap-2 py-2 text-[9px] font-black uppercase tracking-widest transition-all">
              <span>2. En Proceso</span>
              <span *ngIf="ticket()?.status === status.RESOLVED || ticket()?.status === status.CLOSED">✅</span>
            </div>
            <div [class.bg-green-600]="ticket()?.status === status.RESOLVED || ticket()?.status === status.CLOSED"
                 [class.text-white]="ticket()?.status === status.RESOLVED || ticket()?.status === status.CLOSED"
                 [class.bg-slate-200]="ticket()?.status !== status.RESOLVED && ticket()?.status !== status.CLOSED"
                 [class.text-slate-400]="ticket()?.status !== status.RESOLVED && ticket()?.status !== status.CLOSED"
                 class="flex-1 flex items-center justify-center gap-2 py-2 text-[9px] font-black uppercase tracking-widest transition-all">
              <span>3. Solución</span>
              <span *ngIf="ticket()?.status === status.RESOLVED || ticket()?.status === status.CLOSED">✅</span>
            </div>
            <div [class.bg-slate-800]="ticket()?.status === status.CLOSED"
                 [class.text-white]="ticket()?.status === status.CLOSED"
                 [class.bg-slate-200]="ticket()?.status !== status.CLOSED"
                 [class.text-slate-400]="ticket()?.status !== status.CLOSED"
                 class="flex-1 flex items-center justify-center gap-2 py-2 rounded-r-xl text-[9px] font-black uppercase tracking-widest transition-all">
              <span>4. Finalizado</span>
            </div>
          </div>
        </div>

        <!-- Header del Ticket (Mailbox Header) -->
        <header class="p-8 border-b border-slate-100 shrink-0 bg-white">
          <div class="flex items-start justify-between mb-4">
            <div class="flex flex-col gap-1">
              <div class="flex items-center gap-2">
                <span class="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-widest">
                  {{ ticket()?.code }}
                </span>
                <span [class]="getPriorityClass(ticket()?.priority)" class="text-[9px] font-black uppercase px-2 py-0.5 rounded-full border">
                  {{ ticket()?.priority }}
                </span>
              </div>
              <h1 class="text-xl font-black text-slate-900 leading-tight mt-2">{{ ticket()?.subject }}</h1>
            </div>

            <div class="flex items-center gap-2">
              <select [ngModel]="ticket()?.status" (ngModelChange)="updateStatus($event)" 
                      class="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest focus:ring-2 ring-blue-500/20 outline-none cursor-pointer">
                <option [value]="status.OPEN">Abierto</option>
                <option [value]="status.IN_PROGRESS">En Progreso</option>
                <option [value]="status.RESOLVED">Resuelto</option>
                <option [value]="status.CLOSED">Cerrado</option>
              </select>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-black text-slate-500 border border-slate-200">
                {{ ticket()?.reporter?.name?.charAt(0) || 'U' }}
              </div>
              <div>
                <p class="text-xs font-black text-slate-900">{{ ticket()?.reporter?.name }}</p>
                <p class="text-[10px] font-bold text-slate-400 lowercase italic">{{ ticket()?.reporter?.email }}</p>
              </div>
            </div>
            
            <div class="text-right">
              <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Asignado a</p>
              <p class="text-xs font-bold text-slate-700">{{ ticket()?.assignee?.name || 'Sin asignar' }}</p>
            </div>
          </div>
        </header>

        <!-- Body / Conversation (Scrollable) -->
        <div class="flex-1 overflow-y-auto p-8 space-y-12 custom-scrollbar bg-slate-50/20">
          
          <!-- SECCIÓN: RECEPCIÓN -->
          <section>
            <div class="flex items-center gap-3 mb-6">
              <div class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs">📩</div>
              <h3 class="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Recepción del Caso</h3>
              <div class="flex-1 h-px bg-slate-100"></div>
            </div>
            <div class="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden">
              <div class="absolute top-0 left-0 w-1 h-full bg-blue-600 opacity-20"></div>
              <div class="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                {{ ticket()?.description }}
              </div>
              <div class="mt-6 flex items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <span>📅 {{ ticket()?.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
                <span>👤 {{ ticket()?.reporter?.name }}</span>
              </div>
            </div>
          </section>

          <!-- SECCIÓN: SOLUCIÓN (Solo si está Resuelto o Cerrado) -->
          @if (ticket()?.status === status.RESOLVED || ticket()?.status === status.CLOSED) {
            <section>
              <div class="flex items-center gap-3 mb-6">
                <div class="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white text-xs">💡</div>
                <h3 class="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Resolución y Solución</h3>
                <div class="flex-1 h-px bg-slate-100"></div>
              </div>
              <div class="bg-green-50/30 rounded-3xl p-8 border border-green-100 shadow-sm relative overflow-hidden">
                <div class="absolute top-0 left-0 w-1 h-full bg-green-600 opacity-40"></div>
                <div class="text-sm text-slate-800 font-black mb-4 uppercase tracking-tighter">Resolución Oficial</div>
                <div class="text-sm text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                  {{ ticket()?.solution || 'El caso ha sido marcado como resuelto satisfactoriamente.' }}
                </div>
                <div class="mt-6 text-[10px] text-green-600 font-black uppercase tracking-widest">
                  Resuelto el {{ ticket()?.resolved_at | date:'dd/MM/yyyy HH:mm' }}
                </div>
              </div>
            </section>
          }

          <!-- SECCIÓN: COMENTARIOS / INTERACCIONES -->
          <section>
            <div class="flex items-center gap-3 mb-6">
              <div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-white text-xs">💬</div>
              <h3 class="text-[11px] font-black text-slate-800 uppercase tracking-[0.2em]">Bitácora de Seguimiento</h3>
              <div class="flex-1 h-px bg-slate-100"></div>
            </div>
            
            <div class="space-y-6">
              @for (comment of ticket()?.interactions; track comment.id) {
                <div [class.bg-blue-50/40]="comment.is_internal" 
                     class="flex gap-4 p-5 rounded-3xl transition-all border border-transparent hover:border-slate-100 bg-white">
                  <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 overflow-hidden shrink-0 border border-slate-200">
                    <img *ngIf="comment.user?.name" [src]="'https://ui-avatars.com/api/?name=' + comment.user.name" alt="AV">
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-baseline justify-between mb-1">
                      <div class="flex items-center gap-2">
                        <span class="font-black text-[11px] text-slate-800 uppercase tracking-tight">{{ comment.user?.name }}</span>
                        @if (comment.is_internal) {
                          <span class="text-[8px] font-black uppercase text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">Nota Interna</span>
                        }
                      </div>
                      <span class="text-[9px] font-bold text-slate-400">{{ comment.created_at | date:'short' }}</span>
                    </div>
                    <p class="text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{{ comment.message }}</p>
                  </div>
                </div>
              } @empty {
                <div class="py-10 text-center opacity-30 italic text-xs">No hay interacciones registradas en el seguimiento.</div>
              }
            </div>
          </section>
        </div>

        <!-- Footer / Reply Box (Fixed at Bottom) -->
        <footer class="p-6 border-t border-slate-100 bg-white">
          <div class="bg-slate-50 rounded-2xl p-4 ring-inset focus-within:ring-2 ring-blue-500/20 transition-all">
            <textarea [(ngModel)]="replyMessage" 
              placeholder="Escribe una nota de seguimiento interna..."
              class="w-full bg-transparent border-none outline-none resize-none text-xs font-bold text-slate-700 placeholder:text-slate-300 min-h-[80px]"></textarea>
            
            <div class="flex items-center justify-between mt-4">
              <div class="flex items-center gap-4">
                <span class="inline-flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase tracking-widest">
                  🔒 Nota interna — no visible para el cliente
                </span>
                <button class="text-lg opacity-40 hover:opacity-100 transition-opacity">📎</button>
              </div>
              
              <button (click)="sendReply()" [disabled]="!replyMessage.trim()"
                      class="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100 disabled:opacity-30 transition-all">
                Enviar Mensaje
              </button>
            </div>
          </div>
        </footer>
      } @else {
        <div class="flex-1 flex flex-col items-center justify-center p-20 opacity-40">
          <div class="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p class="text-[10px] font-black uppercase tracking-widest">Cargando conversación...</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
  `]
})
export class TicketDetailComponent implements OnInit {
  private _route = inject(ActivatedRoute);
  private _ticketService = inject(TicketService);

  ticket = signal<Ticket | null>(null);
  status = TicketStatus;
  
  replyMessage = '';

  // Reactividad ante cambios de ID en la URL
  constructor() {
    effect(() => {
      const params = toSignal(this._route.params)();
      if (params && params['id']) {
        this.loadTicket(params['id']);
      }
    });
  }

  ngOnInit() {}

  loadTicket(id: number) {
    this._ticketService.getTicketById(id).subscribe(t => this.ticket.set(t));
  }

  updateStatus(newStatus: TicketStatus) {
    let solution: string | undefined = undefined;
    
    if (newStatus === TicketStatus.RESOLVED) {
      const promptVal = prompt('Por favor, ingrese la solución oficial del caso:');
      if (promptVal === null) {
        this.loadTicket(this.ticket()!.id);
        return;
      }
      solution = promptVal;
    }

    if (!this.ticket()) return;
    this._ticketService.updateStatus(this.ticket()!.id, newStatus, 'Actualización desde portal', solution).subscribe(() => {
      this.loadTicket(this.ticket()!.id);
      this._ticketService.getTickets().subscribe(); // Refrescar lista lateral
    });
  }

  sendReply() {
    if (!this.replyMessage.trim() || !this.ticket()) return;

    this._ticketService.addInteraction(this.ticket()!.id, this.replyMessage).subscribe(() => {
      this.replyMessage = '';
      this.loadTicket(this.ticket()!.id);
    });
  }

  getPriorityClass(priority: string | undefined): string {
    switch (priority?.toUpperCase()) {
      case 'URGENT': return 'bg-red-50 text-red-600 border-red-100';
      case 'HIGH': return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'MEDIUM': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  }
}
