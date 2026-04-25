import { Component, inject, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TicketService } from '@core/services/ticket.service';
import { Ticket, TicketStatus } from '@core/models/support.models';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
   selector: 'app-ticket-preview',
   standalone: true,
   imports: [CommonModule, RouterLink],
   template: `
    <div class="flex flex-col h-full bg-slate-50/50 animate-in slide-in-from-right duration-300 overflow-y-auto custom-scrollbar min-h-0">
      @if (ticket()) {
        <!-- Header Section (Sticky) -->
        <header class="sticky top-0 z-50 p-4 bg-slate-50 border-b border-slate-200 shadow-sm space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{{ ticket()?.code }}</span>
              @if (ticket()?.metadata?.event_id) {
                <span class="text-[9px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200 flex items-center gap-1">
                  ⚡ Automático
                </span>
              }
            </div>
            <button [routerLink]="['/tickets']" 
                    class="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-400 hover:text-slate-900 cursor-pointer group"
                    title="CERRAR DETALLE">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>

          <h1 class="text-[18px] font-bold text-slate-900 leading-tight tracking-tight uppercase mb-1">
            {{ ticket()?.subject }}
          </h1>

          <div class="flex flex-wrap items-center gap-2">
             <span [class]="getPriorityBadgeClass(ticket()?.priority)" class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-transparent flex items-center gap-1.5 bg-opacity-15 transition-all">
                @switch (ticket()?.priority) {
                  @case ('URGENT') {
                    <svg class="w-3 h-3 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  }
                  @case ('HIGH') {
                    <svg class="w-3 h-3 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                  }
                  @case ('MEDIUM') {
                    <svg class="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M20 12H4"></path></svg>
                  }
                  @default {
                    <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
                  }
                }
                {{ getPriorityLabel(ticket()?.priority) }}
             </span>
             <span [class]="getStatusBadgeClass(ticket()?.status || 'OPEN')" class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border border-transparent flex items-center gap-1.5 bg-opacity-15">
                <span class="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span> {{ getStatusLabel(ticket()?.status || 'OPEN') }}
             </span>
             <span class="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 uppercase tracking-widest px-1 py-0.5">
                <span class="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-200"></span>
                <span>SLA</span>
             </span>
          </div>

          @if (!ticket()?.assignee_id) {
            <button (click)="assignMe()" 
                    class="w-full py-2.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 active:scale-[0.98] animate-pulse hover:animate-none cursor-pointer">
               <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
               Asignarme este Ticket
            </button>
          }

          <button [routerLink]="['/tickets', ticket()?.id, 'manage']" 
                  class="w-full py-2.5 bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-slate-200 hover:bg-black transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer">
             <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
             Ir a Gestión Completa
          </button>
        </header>

        <!-- Body Sections -->
        <div class="p-5 space-y-8 bg-white/40">
          
          <!-- Descripción -->
          <section class="space-y-2">
             <div class="flex items-center gap-1.5 text-slate-900">
                <svg class="w-3.5 h-3.5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
                <h3 class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Descripción</h3>
             </div>
             <div class="bg-white border border-slate-300 rounded-xl p-4 text-[11px] text-slate-800 leading-relaxed font-bold uppercase shadow-sm">
                {{ ticket()?.description }}
             </div>
          </section>

          <!-- Documento Vinculado -->
          @if (ticket()?.related_documents?.length) {
            <section class="space-y-2">
               <div class="flex items-center gap-1.5 text-slate-900">
                  <svg class="w-3.5 h-3.5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                  <h3 class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Documento Vinculado</h3>
               </div>
               <div class="bg-blue-50/30 border border-blue-100/50 rounded-xl p-4 flex items-center justify-between group transition-all hover:bg-blue-50/50">
                  <div>
                     <p class="text-[9px] font-bold text-blue-800 uppercase tracking-widest mb-0.5">{{ ticket()?.related_documents?.[0]?.type }}</p>
                     <p class="text-[13px] font-bold text-blue-600">{{ ticket()?.related_documents?.[0]?.code }}</p>
                  </div>
                  <button class="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-bold text-slate-600 uppercase tracking-widest shadow-sm hover:border-blue-400 transition-all">
                     Ver Documento
                  </button>
               </div>
            </section>
          }

          <!-- Evento Automático (Forense) -->
          @if (ticket()?.metadata?.event_id) {
            <section class="space-y-2">
               <div class="flex items-center gap-1.5 text-slate-900">
                  <svg class="w-3.5 h-3.5 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                  <h3 class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Evento Automático</h3>
               </div>
               <div class="bg-amber-50/30 border border-amber-100/50 rounded-xl p-4 space-y-3">
                  <div class="grid grid-cols-2 gap-4">
                     <div>
                        <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Event ID</p>
                        <p class="text-[11px] font-bold text-slate-800 uppercase">EVT-{{ ticket()?.metadata?.event_id }}</p>
                     </div>
                     <div>
                        <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Usuario</p>
                        <p class="text-[11px] font-bold text-slate-800 uppercase">USR-{{ ticket()?.metadata?.erp_user_id || 'SYS' }}</p>
                     </div>
                  </div>
                  <div class="space-y-1.5">
                     <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Stack Trace:</p>
                     <div class="bg-white/80 border border-slate-100 rounded-lg p-3 font-mono text-[10px] text-slate-500 overflow-x-auto leading-relaxed">
                        at InvoiceCalculator.calculateTax() line 342<br>
                        at InvoiceService.generate()
                     </div>
                  </div>
               </div>
            </section>
          }

          <!-- Info Grid (Timestamps & People) -->
          <div class="grid grid-cols-2 gap-x-6 gap-y-6 pt-6 border-t-2 border-slate-300">
             <div class="space-y-4">
                <div class="flex items-center gap-3">
                   <svg class="w-4 h-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                   <div>
                      <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">FECHA CREACIÓN</p>
                      <p class="text-[11px] font-bold text-slate-800 uppercase">{{ ticket()?.created_at | date:"dd 'de' MMMM yyyy" | uppercase }}</p>
                   </div>
                </div>
                <div class="flex items-center gap-3">
                   <svg class="w-4 h-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                   <div>
                      <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">REPORTADO POR</p>
                      <p class="text-[11px] font-bold text-slate-800 uppercase">{{ ticket()?.reporter?.name | uppercase }}</p>
                   </div>
                </div>
                <div class="flex items-center gap-3">
                   <svg class="w-4 h-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                   <div>
                      <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">TIEMPO INVERTIDO</p>
                      <p class="text-[11px] font-bold text-slate-800 uppercase">2H 25M</p>
                   </div>
                </div>
             </div>
             <div class="space-y-4">
                <div class="flex items-center gap-3">
                   <svg class="w-4 h-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                   <div>
                      <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ENTREGA ESTIMADA</p>
                      <p class="text-[11px] font-bold text-slate-800 uppercase">{{ (ticket()?.delivery_date | date:"dd 'de' MMMM yyyy") || 'SIN FECHA' | uppercase }}</p>
                   </div>
                </div>
                <div class="flex items-center gap-3">
                   <svg class="w-4 h-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 005.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                   <div>
                      <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ASIGNADO A</p>
                      <p class="text-[11px] font-bold text-slate-800 uppercase">{{ ticket()?.assignee?.name || 'SIN ASIGNAR' | uppercase }}</p>
                   </div>
                </div>
                <div class="flex items-center gap-3">
                   <svg class="w-4 h-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                   <div>
                      <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">SLA RESOLUCIÓN</p>
                      <p class="text-[11px] font-bold text-slate-800 uppercase">4H</p>
                   </div>
                </div>
             </div>
          </div>

          <!-- Etiquetas Section -->
          <section class="pt-6 border-t-2 border-slate-300 space-y-3">
             <h3 class="text-[10px] font-bold uppercase tracking-widest text-slate-400">Etiquetas</h3>
             <div class="flex flex-wrap gap-1.5">
                @for (tag of ticket()?.tags; track tag.id) {
                   <span class="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                      {{ tag.name }}
                   </span>
                }
             </div>
          </section>

        </div>
      } @else {
        <div class="flex-1 flex flex-col items-center justify-center p-10 opacity-30">
          <div class="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p class="text-[8px] font-black uppercase tracking-widest">Cargando Previsualización...</p>
        </div>
      }
    </div>
  `,
   styles: [`
    :host { display: block; height: 100%; }
    .custom-scrollbar::-webkit-scrollbar { width: 3px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
  `]
})
export class TicketPreviewComponent implements OnInit {
   private _route = inject(ActivatedRoute);
   private _ticketService = inject(TicketService);

   ticket = signal<Ticket | null>(null);

   params = toSignal(this._route.params);

   constructor() {
      effect(() => {
         const p = this.params();
         if (p && p['id']) {
            this.loadTicket(p['id']);
         }
      });
   }

   ngOnInit() { }

   loadTicket(id: number) {
      this._ticketService.getTicketById(id).subscribe(t => this.ticket.set(t));
   }

   assignMe() {
      if (!this.ticket()) return;
      this._ticketService.assignTicket(this.ticket()!.id).subscribe(() => {
         this.loadTicket(this.ticket()!.id);
         this._ticketService.getTickets().subscribe();
      });
   }

   getPriorityBadgeClass(priority: string | undefined): string {
      switch (priority?.toUpperCase()) {
         case 'URGENT': return 'bg-red-50 text-red-600 border-red-100';
         case 'HIGH': return 'bg-orange-50 text-orange-600 border-orange-100';
         case 'MEDIUM': return 'bg-blue-50 text-blue-600 border-blue-100';
         default: return 'bg-slate-50 text-slate-500 border-slate-100';
      }
   }

   getStatusBadgeClass(status: string): string {
      switch (status) {
         case TicketStatus.OPEN: return 'bg-amber-100 text-amber-600 border-amber-200';
         case TicketStatus.IN_PROGRESS: return 'bg-purple-50 text-purple-600 border-purple-100';
         case TicketStatus.RESOLVED: return 'bg-green-100 text-green-600 border-green-200';
         case TicketStatus.CLOSED: return 'bg-slate-100 text-slate-500 border-slate-200';
         default: return 'bg-slate-100 text-slate-500 border-slate-200';
      }
   }



   getPriorityLabel(priority: string | undefined): string {
      switch (priority?.toUpperCase()) {
         case 'URGENT':
         case 'CRITICAL': return 'CRÍTICA';
         case 'HIGH': return 'ALTA';
         case 'MEDIUM': return 'MEDIA';
         case 'LOW': return 'BAJA';
         default: return priority || '';
      }
   }

   getStatusLabel(status: string): string {
      switch (status) {
         case TicketStatus.OPEN: return 'ABIERTO';
         case TicketStatus.IN_PROGRESS: return 'EN PROGRESO';
         case TicketStatus.RESOLVED: return 'RESUELTO';
         case TicketStatus.CLOSED: return 'CERRADO';
         default: return status;
      }
   }
}
