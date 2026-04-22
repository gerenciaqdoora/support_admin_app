import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TicketService } from '@core/services/ticket.service';
import { AuthService } from '@core/services/auth.service';
import { Ticket, TicketStatus } from '@core/models/support.models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="max-w-5xl mx-auto space-y-6 pb-20">
      <!-- Breadcrumb & Actions -->
      <div class="flex items-center justify-between">
        <nav class="flex items-center gap-2 text-sm font-medium">
          <a routerLink="/tickets" class="text-slate-400 hover:text-primary transition-colors">Tickets</a>
          <span class="text-slate-300">/</span>
          @if (ticket()) { <span class="text-slate-800">{{ ticket()?.code }}</span> }
        </nav>
        
        <div class="flex items-center gap-3">
          <select [ngModel]="ticket()?.status" (ngModelChange)="updateStatus($event)" 
                  class="bg-white border-none glass-card rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 ring-accent outline-none">
            <option [value]="status.OPEN">Abierto</option>
            <option [value]="status.IN_PROGRESS">En Progreso</option>
            <option [value]="status.RESOLVED">Resuelto</option>
            <option [value]="status.CLOSED">Cerrado</option>
          </select>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left: Ticket Content & Interactions -->
        <div class="lg:col-span-2 space-y-6">
          <!-- Main Ticket Info -->
          <div class="glass-card bg-white rounded-3xl p-8 shadow-sm">
            <div class="flex items-start justify-between mb-6">
              <h1 class="text-2xl font-black text-slate-800 leading-tight">{{ ticket()?.subject }}</h1>
              <span class="px-3 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-black uppercase">
                {{ ticket()?.type }}
              </span>
            </div>
            
            <div class="prose prose-slate max-w-none text-slate-600 leading-relaxed">
              {{ ticket()?.description }}
            </div>

            <!-- Evidence / Files -->
            @if (ticket()?.evidences?.length) {
              <div class="mt-8 pt-8 border-t border-slate-50">
                <h4 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Evidencias</h4>
                <div class="flex flex-wrap gap-3">
                  @for (file of ticket()?.evidences; track file.id) {
                    <div class="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer border border-transparent hover:border-accent/10">
                      <span class="text-2xl">📄</span>
                      <div>
                        <p class="text-xs font-bold text-slate-700 truncate max-w-[120px]">{{ file.file_name }}</p>
                        <p class="text-[10px] text-slate-400">{{ (file.file_size / 1024) | number:'1.0-1' }} KB</p>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Interactions Feed (FB Style) -->
          <div class="space-y-4">
            <h3 class="text-lg font-bold text-slate-800 px-2">Interacciones</h3>
            
            <!-- Reply Box -->
            <div class="glass-card bg-white rounded-3xl p-6 shadow-sm ring-inset focus-within:ring-2 ring-accent transition-all">
              <textarea [(ngModel)]="replyMessage" placeholder="Escribe una respuesta o nota interna..." 
                        class="w-full bg-transparent border-none outline-none resize-none text-slate-700 placeholder:text-slate-300 min-h-[100px]"></textarea>
              <div class="flex items-center justify-between mt-4 pt-4 border-t border-slate-50">
                <div class="flex items-center gap-4">
                  <label class="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" [(ngModel)]="isInternal" class="w-4 h-4 rounded border-slate-200 text-primary focus:ring-primary">
                    <span class="text-xs font-bold text-slate-400 group-hover:text-slate-600 transition-colors">Nota Interna</span>
                  </label>
                  <button class="text-xl opacity-40 hover:opacity-100 transition-opacity">📎</button>
                </div>
                <button (click)="sendReply()" [disabled]="!replyMessage.trim()"
                        class="px-8 py-2.5 bg-primary text-white rounded-xl font-bold shadow-lg hover:shadow-primary/30 disabled:opacity-30 transition-all">
                  Enviar Respuesta
                </button>
              </div>
            </div>

            <!-- Feed -->
            <div class="space-y-6 mt-8">
              @for (comment of ticket()?.interactions; track comment.id) {
                <div [class.bg-blue-50/50]="comment.is_internal" 
                     class="flex gap-4 p-4 rounded-3xl transition-colors relative group">
                  <div class="w-10 h-10 rounded-full bg-slate-200 overflow-hidden flex-shrink-0">
                    <img [src]="'https://ui-avatars.com/api/?name=' + comment.user?.name" alt="Avatar">
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-baseline gap-2 mb-1">
                      <span class="font-bold text-sm text-slate-800">{{ comment.user?.name }}</span>
                      @if (comment.is_internal) {
                        <span class="text-[9px] font-black uppercase tracking-tighter text-blue-500 bg-blue-100 px-1.5 py-0.5 rounded">Nota Interna</span>
                      }
                      <span class="text-[10px] text-slate-400">{{ comment.created_at | date:'short' }}</span>
                    </div>
                    <p class="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{{ comment.message }}</p>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- Right: Metadata & Sidebar -->
        <div class="space-y-6">
          <div class="glass-card bg-white rounded-3xl p-6 space-y-6 shadow-sm">
            <div>
              <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Asignado a</h4>
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs">👤</div>
                <span class="text-sm font-bold text-slate-700">{{ ticket()?.assignee?.name || 'Sin asignar' }}</span>
              </div>
            </div>

            <div class="pt-6 border-t border-slate-50">
              <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Suscriptor / Empresa</h4>
              <p class="text-sm font-bold text-slate-800">Suscriptor ID: {{ ticket()?.suscriptor_id }}</p>
              <p class="text-xs text-slate-400 mt-1">Empresa: {{ ticket()?.company_id || 'N/A' }}</p>
            </div>

            <div class="pt-6 border-t border-slate-50">
              <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Fechas</h4>
              <div class="space-y-3">
                <div class="flex justify-between text-xs">
                  <span class="text-slate-400 font-medium">Creado</span>
                  <span class="text-slate-800 font-bold">{{ ticket()?.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
                <div class="flex justify-between text-xs">
                  <span class="text-slate-400 font-medium">Entrega (SLA)</span>
                  <span class="text-slate-800 font-bold">{{ (ticket()?.delivery_date | date:'dd/MM/yyyy') || 'Pendiente' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TicketDetailComponent implements OnInit {
  private _route = inject(ActivatedRoute);
  private _ticketService = inject(TicketService);
  private _auth = inject(AuthService);

  ticket = signal<Ticket | null>(null);
  status = TicketStatus;

  // Form
  replyMessage = '';
  isInternal = false;

  ngOnInit() {
    const id = this._route.snapshot.params['id'];
    this.loadTicket(id);
  }

  loadTicket(id: number) {
    this._ticketService.getTicketById(id).subscribe(t => this.ticket.set(t));
  }

  updateStatus(newStatus: TicketStatus) {
    if (!this.ticket()) return;
    this._ticketService.updateStatus(this.ticket()!.id, newStatus).subscribe(() => {
      this.loadTicket(this.ticket()!.id);
    });
  }

  sendReply() {
    if (!this.replyMessage.trim() || !this.ticket()) return;

    this._ticketService.addInteraction(this.ticket()!.id, this.replyMessage, this.isInternal).subscribe(() => {
      this.replyMessage = '';
      this.isInternal = false;
      this.loadTicket(this.ticket()!.id);
    });
  }
}
