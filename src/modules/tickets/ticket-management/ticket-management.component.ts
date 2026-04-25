import { Component, inject, OnInit, signal, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { TicketService } from '@core/services/ticket.service';
import { Ticket, TicketStatus, TicketInteraction, ForensicLog } from '@core/models/support.models';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '@app/core/services/auth.service';

@Component({
  selector: 'app-ticket-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="flex flex-col h-full bg-white overflow-hidden min-h-0">
      
      <!-- Notificación Premium (Glassmorphism) -->
      @if (notification()) {
        <div class="fixed top-12 left-1/2 -translate-x-1/2 z-[100] animate-in fade-in slide-in-from-top-4 duration-500 pointer-events-none">
          <div class="flex items-center gap-4 bg-slate-900/95 backdrop-blur-2xl border border-white/10 px-8 py-4 rounded-full shadow-[0_30px_70px_rgba(0,0,0,0.4)]">
            <div [class]="notification()?.type === 'success' ? 'bg-green-500' : notification()?.type === 'error' ? 'bg-red-500' : 'bg-blue-500'" 
                 class="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] shadow-lg">
                 {{ notification()?.type === 'success' ? '✓' : '!' }}
            </div>
            <span class="text-[10px] font-black text-white uppercase tracking-[0.2em] whitespace-nowrap">{{ notification()?.message }}</span>
          </div>
        </div>
      }

      <!-- Alerta de Chat Pulsante (Enterprise Alert) -->
      @if (chatSessionStatus() === 'REQUESTED') {
        <div class="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-8 duration-700">
          <div (click)="activeTab.set('chat')" class="flex items-center gap-6 bg-green-600 px-10 py-5 rounded-[2rem] shadow-[0_20px_50px_rgba(22,163,74,0.4)] border border-green-400 cursor-pointer group active:scale-95 transition-all">
            <div class="relative">
              <div class="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl shadow-lg animate-bounce">💬</div>
              <div class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-ping"></div>
            </div>
            <div>
              <p class="text-[12px] font-black text-white uppercase tracking-widest leading-none mb-1">Solicitud de Chat en Vivo</p>
              <p class="text-[10px] text-green-100 font-bold uppercase tracking-tight">El cliente está esperando una respuesta inmediata...</p>
            </div>
            <button (click)="startChat(); $event.stopPropagation()" class="ml-4 h-11 px-6 bg-white text-green-700 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-green-50 transition-all shadow-md cursor-pointer">
              ACEPTAR AHORA
            </button>
          </div>
        </div>
      }

      <!-- 1. Enterprise Header (Misión Crítica) -->
      <header class="bg-slate-50 border-b border-slate-200 px-8 py-6 flex items-center justify-between shrink-0 z-30">
        <div class="flex items-center gap-8">
          <button routerLink="/tickets" class="flex flex-col items-center gap-1 group cursor-pointer">
            <div class="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-slate-100 group-hover:text-blue-600 transition-all">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            </div>
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-tighter group-hover:text-slate-900 transition-colors">Volver al Inbox</span>
          </button>

          <div class="w-px h-12 bg-slate-100 mx-2"></div>

          <div class="flex flex-col">
            <div class="flex items-center gap-3 mb-1">
              <span class="text-[11px] font-black text-slate-300 tracking-wider">{{ ticket()?.code }}</span>
              @if (ticket()?.metadata?.event_id) {
                <span class="px-2 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200 text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5">
                  ⚡ Automático
                </span>
              }
            </div>
            <h1 class="text-[22px] font-black text-slate-900 tracking-tight leading-none uppercase">{{ ticket()?.subject }}</h1>
            
            <!-- Badges Row Ultra-Compact -->
            <div class="flex items-center gap-2 mt-3">
              <span [class]="getPriorityClass(ticket()?.priority)" class="px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border transition-all">
                @switch (ticket()?.priority) {
                  @case ('URGENT') {
                    <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  }
                  @case ('HIGH') {
                    <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                  }
                  @case ('MEDIUM') {
                    <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M20 12H4"></path></svg>
                  }
                  @default {
                    <svg class="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path></svg>
                  }
                }
                {{ ticket()?.priority === 'URGENT' ? 'URGENTE' : 
                   ticket()?.priority === 'HIGH' ? 'ALTA' : 
                   ticket()?.priority === 'MEDIUM' ? 'MEDIA' : 'BAJA' }}
              </span>
              <span [class]="getStatusClass(ticket()?.status)" class="px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border transition-all">
                <span class="w-1.5 h-1.5 rounded-full" 
                      [class.bg-amber-500]="ticket()?.status === 'OPEN'" 
                      [class.bg-blue-500]="ticket()?.status === 'IN_PROGRESS'" 
                      [class.bg-green-500]="ticket()?.status === 'RESOLVED'"
                      [class.bg-slate-400]="ticket()?.status === 'CLOSED'"></span>
                {{ ticket()?.status === 'OPEN' ? 'ABIERTO' : 
                   ticket()?.status === 'IN_PROGRESS' ? 'EN PROGRESO' : 
                   ticket()?.status === 'RESOLVED' ? 'RESUELTO' : 'CERRADO' }}
              </span>

              @if (chatSessionStatus() === 'REQUESTED' || chatSessionStatus() === 'ACTIVE') {
                <span class="px-3 py-0.5 bg-green-50 text-green-600 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-green-100 animate-pulse">
                  <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  • CHAT {{ chatSessionStatus() === 'REQUESTED' ? 'SOLICITADO' : 'ACTIVO' }}
                </span>
              }

              @if (ticket()?.status === 'CLOSED') {
                <span class="px-3 py-0.5 bg-slate-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-slate-900/20">
                  <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path></svg>
                  ARCHIVO INMUTABLE
                </span>
              }

              <span class="px-3 py-0.5 bg-white text-slate-500 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)] animate-pulse"></span> SLA
              </span>
            </div>
            
            <!-- Metadata Grid Ultra-Compact -->
            <div class="grid grid-cols-4 gap-x-12 gap-y-1 mt-4">
              <div class="flex flex-col min-w-[120px]">
                <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Reportado por</span>
                <span class="text-[10px] font-black text-slate-800 uppercase tracking-tight truncate">{{ ticket()?.reporter?.name }}</span>
              </div>
              <div class="flex flex-col min-w-[120px]">
                <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Asignado a</span>
                <span class="text-[10px] font-black text-slate-800 uppercase tracking-tight truncate">{{ ticket()?.assignee?.name || 'SIN ASIGNAR' }}</span>
              </div>
              <div class="flex flex-col min-w-[100px]">
                <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Tiempo Invertido</span>
                <span class="text-[10px] font-black text-slate-800 uppercase tracking-tight">2H 25M</span>
              </div>
              <div class="flex flex-col min-w-[140px]">
                <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Creado</span>
                <span class="text-[10px] font-black text-slate-800 uppercase tracking-tight">{{ ticket()?.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button (click)="simulateChatRequest()" 
                  class="h-11 px-6 bg-slate-900 text-white rounded-xl text-[12px] font-bold hover:bg-blue-600 transition-all flex items-center gap-3 shadow-md active:scale-95 cursor-pointer group">
             <span class="text-sm">💬</span>
             <span>Simular Chat</span>
          </button>
          <button (click)="saveChanges()" [disabled]="ticket()?.status === 'CLOSED'"
                  class="h-11 px-6 bg-white border border-slate-200 rounded-xl text-[12px] font-bold text-slate-800 hover:bg-slate-50 transition-all flex items-center gap-3 shadow-sm active:scale-95 cursor-pointer group disabled:opacity-30 disabled:cursor-not-allowed">
             <svg class="w-4 h-4 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
             </svg>
             <span>Guardar Cambios</span>
          </button>
          @if (!ticket()?.assignee_id) {
            <button (click)="selfAssign()" 
                    class="h-11 px-6 bg-blue-600 text-white rounded-xl text-[12px] font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100 flex items-center gap-3 active:scale-95 cursor-pointer">
               <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
               </svg>
               <span>Asignarme Ticket</span>
            </button>
          }
          <button (click)="closeTicket()" [disabled]="ticket()?.status === 'CLOSED'"
                  class="h-11 px-6 bg-green-600 text-white rounded-xl text-[12px] font-bold hover:bg-green-700 transition-all shadow-md shadow-green-100 flex items-center gap-3 active:scale-95 cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed">
             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
             </svg>
             <span>Cerrar Ticket</span>
          </button>
        </div>
      </header>

      <!-- 2. Section Navigation Tabs (Enterprise Compact & Centered) -->
      <nav class="bg-white border-b border-slate-200 px-8 shrink-0 z-20 flex items-center justify-center h-12 relative">
        <div class="flex h-full items-center">
          @for (tab of tabs(); track tab.id) {
            <button (click)="activeTab.set(tab.id)"
              [class.border-blue-600]="activeTab() === tab.id"
              [class.text-blue-900]="activeTab() === tab.id"
              [class.bg-blue-50/50]="activeTab() === tab.id"
              [class.border-transparent]="activeTab() !== tab.id"
              [class.text-slate-400]="activeTab() !== tab.id"
              class="h-full px-6 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2.5 hover:text-slate-700 cursor-pointer">
              <span class="text-sm opacity-80" [class.text-blue-600]="activeTab() === tab.id">{{ tab.icon }}</span>
              <span>{{ tab.label }}</span>
              @if (tab.count !== undefined) { 
                <span class="ml-2 bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded text-[8px] font-black min-w-[18px] text-center border border-slate-200">
                  {{ tab.count }}
                </span> 
              }
            </button>
          }
        </div>
      </nav>

      <!-- 3. Scrollable Content Area -->
      <main [class.overflow-hidden]="activeTab() === 'chat'" 
            [class.overflow-y-auto]="activeTab() !== 'chat'"
            class="flex-1 p-6 custom-scrollbar space-y-4 bg-slate-50/30 relative">
        
        @if (activeTab() === 'details') {
          <div class="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 py-4">
            
            <!-- Descripción Section (High Density & Centered) -->
            <section class="space-y-3">
              <div class="flex items-center gap-2 text-slate-400 ml-4">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M4 6h16M4 12h10M4 18h16"></path></svg>
                <h3 class="text-[9px] font-black uppercase tracking-[0.2em]">Descripción</h3>
              </div>
              <div class="bg-white rounded-2xl p-6 text-[11px] text-slate-700 leading-relaxed font-bold uppercase shadow-sm border border-slate-200">
                {{ ticket()?.description }}
              </div>
            </section>

            <!-- ERP Doc Link Section (Compact & Minimalist) -->
            <section class="space-y-3">
              <div class="flex items-center gap-2 text-blue-400 ml-4">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                <h3 class="text-[9px] font-black uppercase tracking-[0.2em]">Documento Vinculado</h3>
              </div>
              <div class="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between group">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-xl border border-blue-50 shadow-sm">📑</div>
                  <div>
                    <p class="text-[10px] font-black text-blue-900 uppercase tracking-tight">Factura de Exportación</p>
                    <p class="text-lg font-black text-blue-600 leading-none">F-00892</p>
                  </div>
                </div>
                <button class="h-10 px-6 bg-white border border-blue-200 rounded-lg text-[10px] font-black text-blue-600 uppercase tracking-widest shadow-sm hover:bg-blue-600 hover:text-white transition-all active:scale-95 cursor-pointer">
                  VER DOCUMENTO
                </button>
              </div>
            </section>

            <!-- Logger Forensic Data -->
            @if (ticket()?.metadata?.event_id) {
              <section class="space-y-6">
                <div class="flex items-center gap-3 text-amber-600">
                  <span class="text-2xl">⚡</span>
                  <h3 class="text-sm font-black uppercase tracking-[0.3em]">Evento de Sistema (Logger Forense)</h3>
                </div>
                <div class="bg-amber-50 rounded-[3rem] border-2 border-amber-100 p-12 space-y-10 shadow-xl shadow-amber-50">
                  <div class="grid grid-cols-2 gap-20">
                    <div class="bg-white/50 p-6 rounded-2xl border border-amber-100/50">
                      <p class="text-[11px] font-black text-amber-800/40 uppercase tracking-widest">Identificación de Evento</p>
                      <p class="text-lg font-black text-amber-900 uppercase mt-2">EVT-{{ ticket()?.metadata?.event_id }}</p>
                    </div>
                    <div class="bg-white/50 p-6 rounded-2xl border border-amber-100/50">
                      <p class="text-[11px] font-black text-amber-800/40 uppercase tracking-widest">Usuario Afectado</p>
                      <p class="text-lg font-black text-amber-900 uppercase mt-2">USR-{{ ticket()?.metadata?.erp_user_id || 'SISTEMA' }}</p>
                    </div>
                  </div>
                  <div class="space-y-4">
                    <p class="text-[11px] font-black text-amber-800 uppercase tracking-widest ml-4">Traza de Error Detallada:</p>
                    <div class="bg-slate-900 rounded-[2rem] p-10 font-mono text-[12px] text-blue-400 leading-relaxed shadow-2xl overflow-x-auto">
                      at InvoiceCalculator.calculateTax() line 342<br>
                      at InvoiceService.generate(params: &#123;id: 892, type: 'EXPORT'&#125;)<br>
                      at Database.executeQuery() method failed
                    </div>
                  </div>
                </div>
              </section>
            }

            <!-- Control de Tiempos (Compact & Immutable) -->
            <section class="space-y-3">
              <div class="flex items-center gap-2 text-slate-400 ml-4">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                <h3 class="text-[9px] font-black uppercase tracking-[0.2em]">Control de Tiempos (Inmutables)</h3>
              </div>
              <div class="grid grid-cols-3 gap-4">
                <!-- Fecha Inicio -->
                <div class="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
                  <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Fecha Inicio</span>
                  <p class="text-[13px] font-black text-slate-800 uppercase tracking-tight">{{ ticket()?.created_at | date:'dd/MM/yyyy HH:mm' }}</p>
                  <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-[8px] font-black border border-blue-100">
                    <svg class="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path></svg>
                    BLOQUEO DE SISTEMA
                  </span>
                </div>
                <!-- Entrega Estimada -->
                <div class="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
                  <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Entrega Estimada (SLA)</span>
                  <div class="pt-1">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black border border-amber-100 italic">
                      ⚡ PRIORIDAD {{ ticket()?.priority === 'URGENT' ? '1' : ticket()?.priority === 'HIGH' ? '2' : '3' }}
                    </span>
                  </div>
                </div>
                <!-- Entrega Real -->
                <div class="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-sm">
                  <span class="text-[8px] font-black text-slate-400 uppercase tracking-widest">Entrega Real</span>
                  <p class="text-[11px] font-bold text-slate-400 italic uppercase">Pendiente de resolución</p>
                </div>
              </div>
            </section>

            <!-- Knowledge Base Resolution (Compact & Critical) -->
            <section class="space-y-3 pt-4 border-t border-slate-100">
              <div class="flex items-center justify-between ml-4">
                <h3 class="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Solución Oficial (Knowledge Base)</h3>
                <span class="px-2.5 py-0.5 bg-red-50 text-red-500 text-[8px] font-black uppercase rounded-full border border-red-100">REQUERIDO PARA CERRAR</span>
              </div>
              <div class="space-y-4">
                <textarea [(ngModel)]="officialSolution" rows="6" 
                  placeholder="DETALLE LA SOLUCIÓN APLICADA. ESTE REGISTRO SE INDEXARÁ EN EL MOTOR DE BÚSQUEDA DE SOPORTE..."
                  class="w-full bg-white border border-slate-200 rounded-3xl p-8 text-[11px] font-bold text-slate-700 focus:ring-4 ring-blue-500/5 outline-none transition-all shadow-sm resize-none uppercase"></textarea>
              </div>
            </section>

            <!-- Tags (Compact Caps) -->
            <section class="space-y-4 pt-4 border-t border-slate-100">
               <h3 class="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Etiquetas del Sistema</h3>
               <div class="flex flex-wrap gap-2">
                  @for (tag of ticket()?.tags; track tag.id) {
                    <span class="px-5 py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-500 uppercase tracking-widest hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all cursor-pointer shadow-sm">
                      {{ tag.name }}
                    </span>
                  }
               </div>
            </section>

          </div>
        }

        @if (activeTab() === 'comments') {
          <div class="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 py-6 px-4">
             
             <!-- Action Header -->
             <div class="flex items-center justify-between mb-2 px-2">
                <div class="flex items-center gap-4">
                  <h3 class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800">Interacciones</h3>
                  <button (click)="isReplyVisible.set(!isReplyVisible())" 
                    class="h-7 px-3 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all cursor-pointer border"
                    [class.bg-slate-900]="isReplyVisible()" [class.text-white]="isReplyVisible()"
                    [class.border-slate-900]="isReplyVisible()"
                    [class.bg-white]="!isReplyVisible()" [class.text-slate-600]="!isReplyVisible()" [class.border-slate-200]="!isReplyVisible()">
                    {{ isReplyVisible() ? '✕ CANCELAR' : '+ NUEVA RESPUESTA' }}
                  </button>
                </div>
                <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{{ ticket()?.interactions?.length }} TOTAL</span>
             </div>

             <!-- New Interaction Area (Top & Toggleable) -->
             @if (isReplyVisible()) {
               <div class="space-y-4 bg-white rounded-3xl p-6 border-2 border-slate-900/5 shadow-xl animate-in slide-in-from-top-4 duration-300">
                  <textarea [(ngModel)]="replyMessage" rows="4" 
                    placeholder="ESCRIBA UNA ACTUALIZACIÓN O NOTA INTERNA..."
                    class="w-full bg-slate-50/50 border border-slate-100 rounded-2xl p-6 text-[11px] font-bold text-slate-800 focus:ring-2 ring-blue-500/5 outline-none transition-all resize-none uppercase"></textarea>
                  
                  <!-- Attached Files Preview Area -->
                  @if (selectedFiles.length > 0) {
                    <div class="flex flex-wrap gap-2 py-2 border-b border-slate-50">
                      @for (file of selectedFiles; track $index) {
                        <div class="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 group/file">
                          <span class="text-[10px]">📎</span>
                          <span class="text-[9px] font-black text-slate-600 uppercase tracking-tight max-w-[150px] truncate">{{ file.name }}</span>
                          <div class="flex items-center gap-1.5 ml-2">
                             <button (click)="previewFile(file)" class="p-1 hover:bg-slate-200 rounded transition-all text-slate-400 hover:text-blue-600 cursor-pointer">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                             </button>
                             <button (click)="removeFile($index)" class="p-1 hover:bg-red-50 rounded transition-all text-slate-300 hover:text-red-500 cursor-pointer">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                             </button>
                          </div>
                        </div>
                      }
                    </div>
                  }

                  <div class="flex items-center justify-between">
                     <div class="flex items-center gap-3">
                        <div class="flex bg-slate-100 p-1 rounded-xl">
                          <button (click)="isInternal = false"
                            [class.bg-slate-900]="!isInternal" [class.text-white]="!isInternal"
                            [class.text-slate-500]="isInternal"
                            class="px-4 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer">
                            PÚBLICA
                          </button>
                          <button (click)="isInternal = true"
                            [class.bg-slate-900]="isInternal" [class.text-white]="isInternal"
                            [class.text-slate-500]="!isInternal"
                            class="px-4 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer">
                            INTERNA
                          </button>
                        </div>
                        
                        <div class="flex items-center gap-2 ml-2 bg-slate-50 px-3 py-1 rounded-xl border border-slate-100">
                           <span class="text-[7px] font-black text-slate-400 uppercase tracking-widest">DEJAR EN:</span>
                           <select [ngModel]="replyStatus()" (ngModelChange)="replyStatus.set($event)" 
                             class="bg-transparent border-none text-[8px] font-black uppercase tracking-widest text-slate-700 outline-none cursor-pointer">
                             <option value="OPEN" title="Requerimiento nuevo sin atención inicial.">ABIERTO</option>
                             <option value="IN_PROGRESS" title="Ticket siendo analizado o ejecutado por soporte.">EN PROGRESO</option>
                             <option value="PENDING_USER" title="Soporte requiere información o validación del cliente.">PENDIENTE USUARIO</option>
                             <option value="RESOLVED" title="Solución técnica aplicada, pendiente de cierre formal.">RESUELTO</option>
                           </select>
                        </div>

                        <div class="group relative">
                           <div class="p-1 hover:bg-slate-100 rounded-full cursor-help transition-all">
                              <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                           </div>
                           <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-slate-900 text-[8px] text-white p-3 rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 shadow-2xl leading-relaxed">
                              <p class="mb-1"><span class="text-blue-400 font-black">ABIERTO:</span> Nuevo sin atención.</p>
                              <p class="mb-1"><span class="text-purple-400 font-black">EN PROGRESO:</span> Análisis activo.</p>
                              <p class="mb-1"><span class="text-sky-400 font-black">PENDIENTE USUARIO:</span> Bloqueo externo.</p>
                              <p class="mb-1"><span class="text-green-400 font-black">RESUELTO:</span> Solución aplicada.</p>
                              <p><span class="text-slate-400 font-black">CERRADO:</span> Finalizado sin cambios.</p>
                              <div class="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
                           </div>
                        </div>

                        <input type="file" #fileInput (change)="onFileSelected($event)" multiple hidden>
                        <button (click)="fileInput.click()" [disabled]="selectedFiles.length >= 5"
                          class="h-8 px-3 bg-white border border-slate-200 rounded-xl flex items-center gap-2 hover:bg-slate-50 transition-all cursor-pointer disabled:opacity-30">
                          <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                          <span class="text-[8px] font-black text-slate-500 uppercase tracking-widest">ADJUNTAR</span>
                        </button>
                     </div>

                     <button (click)="sendReply()" [disabled]="!replyMessage.trim()"
                      class="h-8 px-6 bg-slate-900 text-white rounded-xl text-[8px] font-black uppercase tracking-widest transition-all disabled:opacity-50 cursor-pointer hover:bg-blue-600 shadow-lg shadow-slate-900/10">
                        ENVIAR ACTUALIZACIÓN
                     </button>
                  </div>
               </div>
             }

             <!-- Historical Interactions (Sorted DESC) -->
             <div class="space-y-4">
               @for (interaction of sortedInteractions(); track interaction.id) {
                  <div [class.bg-blue-50/10]="interaction.is_internal" 
                       [class.border-blue-200]="interaction.is_internal"
                       class="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm transition-all hover:shadow-md relative group">
                     
                     <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-50">
                        <div class="flex items-center gap-3">
                           <span class="text-[11px] font-black text-slate-900 uppercase tracking-tight">{{ interaction.user?.name }}</span>
                           
                           @if (interaction.is_internal) {
                             <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 text-white rounded-full text-[8px] font-black shadow-sm">
                                🔒 NOTA INTERNA
                             </span>
                           } @else {
                             @if (interaction.user?.name?.toUpperCase()?.includes('SOPORTE')) {
                               <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 text-white rounded-full text-[8px] font-black shadow-sm">
                                 🛡️ SOPORTE
                               </span>
                             } @else {
                               <span class="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full text-[8px] font-black border border-slate-200">
                                 👁️ CLIENTE
                               </span>
                             }
                           }

                           @if (interaction.set_status) {
                             <span [class]="getStatusClass(interaction.set_status)" class="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border">
                               {{ interaction.set_status === 'OPEN' ? 'ABIERTO' : 
                                  interaction.set_status === 'IN_PROGRESS' ? 'EN PROGRESO' : 
                                  interaction.set_status === 'PENDING_USER' ? 'PENDIENTE USUARIO' : 
                                  interaction.set_status === 'RESOLVED' ? 'RESUELTO' : 'CERRADO' }}
                             </span>
                           }
                        </div>
                        <span class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{{ interaction.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
                     </div>

                     <div class="space-y-4">
                        <p class="text-[11px] text-slate-700 leading-relaxed font-bold uppercase whitespace-pre-wrap pl-1 break-words overflow-wrap-anywhere">
                           {{ interaction.message }}
                        </p>

                        @if (interaction.message.includes('if') || interaction.message.includes('{')) {
                          <div class="bg-slate-900 rounded-xl p-6 font-mono text-[10px] text-blue-300 leading-relaxed shadow-lg relative overflow-hidden group/code">
                             <div class="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                             <code class="block whitespace-pre overflow-x-auto">{{ interaction.message.includes('invoice') ? 'if (invoice.type === "export") {\n  taxRate = 0; // SHOULD BE EXEMPT\n}' : 'at Database.executeQuery() method failed' }}</code>
                             <div class="absolute bottom-2 right-4 text-[7px] font-black text-slate-600 uppercase tracking-widest opacity-0 group-hover/code:opacity-100 transition-all">VISTA PREVIA</div>
                          </div>
                        }
                     </div>
                  </div>
               }
             </div>
          </div>
        }

        @if (activeTab() === 'forensic') {
          <div class="max-w-4xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 py-6 px-4">
             
             <div class="flex items-center justify-between mb-1 px-2">
                <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">Trazabilidad Técnica</h3>
                <span class="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{{ ticket()?.traceability?.length }} EVENTOS</span>
             </div>

             <div class="relative pl-6 space-y-3">
                <!-- Timeline Line -->
                <div class="absolute left-[7px] top-3 bottom-3 w-[1.5px] bg-slate-100"></div>

                 @for (log of sortedTraceability(); track log.id) {
                    <div class="relative animate-in slide-in-from-left-2 duration-300">
                       <!-- Timeline Node (Compact) -->
                       <div class="absolute -left-[23px] top-3.5 w-4 h-4 bg-white border-2 border-blue-500 rounded-full z-10 flex items-center justify-center shadow-sm">
                          <div class="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                       </div>

                       @if (log.action === 'solution_added' || (log.action === 'updated_status' && log.new_value?.status === 'CLOSED')) {
                          <!-- COMPACT CLOSURE HIGHLIGHT -->
                          <div class="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden group">
                             <div class="absolute top-0 right-0 w-32 h-32 bg-green-500/10 blur-[60px] -mr-16 -mt-16"></div>
                             
                             <div class="flex items-center justify-between mb-4">
                                <div class="flex items-center gap-3">
                                   <div class="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-sm shadow-lg shadow-green-900/20">🏆</div>
                                   <div>
                                      <h4 class="text-[11px] font-black uppercase tracking-widest text-white">CIERRE DE INCIDENCIA</h4>
                                      <p class="text-[8px] text-green-400 font-black uppercase tracking-widest">Resolución Aplicada</p>
                                   </div>
                                </div>
                                <span class="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">{{ log.created_at | date:'dd/MM/yyyy HH:mm:ss' }}</span>
                             </div>

                             <div class="bg-white/5 rounded-xl p-4 border border-white/5 mb-4">
                                <p class="text-[11px] text-slate-200 font-bold uppercase leading-relaxed italic">
                                   "{{ ticket()?.official_solution || 'GESTIÓN FINALIZADA' }}"
                                </p>
                             </div>

                             <div class="flex items-center justify-between">
                                <div class="flex items-center gap-4">
                                   <div class="flex flex-col">
                                      <span class="text-[7px] font-black text-slate-500 uppercase tracking-widest">Agente</span>
                                      <span class="text-[9px] font-black text-white uppercase">{{ log.user?.name }}</span>
                                   </div>
                                   <div class="w-px h-4 bg-white/10"></div>
                                   <div class="flex flex-col">
                                      <span class="text-[7px] font-black text-slate-500 uppercase tracking-widest">Log</span>
                                      <span class="text-[9px] font-black text-white uppercase">#{{ log.id }}</span>
                                   </div>
                                </div>
                                <div class="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-lg text-[8px] font-black text-green-500 uppercase tracking-widest">
                                   RESOLUCIÓN OFICIAL
                                </div>
                             </div>
                          </div>
                       } @else {
                         <!-- NORMAL TRACEABILITY CARD -->
                         <div class="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm hover:border-blue-200 transition-all duration-200">
                            <div class="flex items-center justify-between mb-2">
                               <h4 class="text-[10px] font-black uppercase tracking-tight text-slate-900">{{ getEventActionLabel(log.action) }}</h4>
                               <span class="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{{ log.created_at | date:'dd/MM/yyyy HH:mm:ss' }}</span>
                            </div>

                            <div class="flex items-center gap-3 bg-slate-50/50 rounded-lg px-3 py-2 mb-2 border border-slate-100/50">
                                <span class="px-2 py-0.5 bg-white border border-blue-100 text-blue-600 text-[8px] font-black uppercase rounded shadow-sm">
                                   {{ getChangedField(log) }}
                                </span>
                                
                                <div class="flex items-center gap-2 ml-auto text-[8px] font-black uppercase tracking-tight">
                                   <span class="text-slate-400">{{ formatTraceValue(log.old_value) }}</span>
                                   <span class="text-blue-200">→</span>
                                   <span class="text-blue-600">{{ formatTraceValue(log.new_value) }}</span>
                                </div>
                            </div>
                            
                            @if (log.description) {
                               <span class="text-[9px] font-bold text-slate-500 uppercase truncate italic border-l border-slate-200 pl-3">
                                  {{ log.description }}
                               </span>
                            }

                            <div class="flex items-center justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest mt-3">
                               <div class="flex items-center gap-3">
                                  <span class="flex items-center gap-1.5">👤 {{ log.user?.name }}</span>
                                  @if (log.ip_address) {
                                     <span class="text-slate-300">|</span>
                                     <span class="flex items-center gap-1.5">🌐 {{ log.ip_address }}</span>
                                  }
                               </div>
                               <span class="text-slate-300 italic">LOG #{{ log.id }}</span>
                            </div>
                         </div>
                       }
                    </div>
                 }
              </div>
           </div>
        }

        @if (activeTab() === 'chat') {
          <div class="h-full animate-in fade-in duration-500">
            <div class="bg-white rounded-3xl border border-slate-200 shadow-xl h-full flex flex-col overflow-hidden relative mx-auto max-w-5xl">
              
              <!-- Chat Header (Sticky via flex shrink-0) -->
              <header class="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white/80 backdrop-blur-md z-10">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-green-100 text-white relative">
                    👥
                    <div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                  </div>
                  <div>
                    <h3 class="text-[12px] font-black uppercase tracking-widest text-slate-900">Chat en Vivo</h3>
                    <p class="text-[9px] text-slate-400 font-bold uppercase tracking-tight flex items-center gap-1.5 mt-0.5">
                       <span class="w-1 h-1 rounded-full bg-green-500 animate-pulse"></span>
                       Canal Seguro con: {{ ticket()?.reporter?.name }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <button (click)="viewClientDetails()" class="h-8 px-4 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm cursor-pointer">
                    Detalles
                  </button>
                  @if (chatSessionStatus() === 'ACTIVE') {
                    <button (click)="closeChatSession()" class="h-8 px-4 bg-red-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-md shadow-red-100 cursor-pointer animate-in fade-in zoom-in-95 duration-300">
                      Finalizar
                    </button>
                  }
                </div>
              </header>

              <!-- Chat Body (Scrollable) -->
              <div class="flex-1 overflow-y-auto overflow-x-hidden p-6 space-y-4 bg-slate-50/20 custom-scrollbar" #chatContainer>
                @if (chatSessionStatus() === 'NONE' || chatSessionStatus() === 'REQUESTED') {
                  <div class="h-full flex flex-col items-center justify-center text-center space-y-4">
                    <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl grayscale opacity-50">💬</div>
                    <div class="space-y-1">
                      <p class="text-[14px] font-black text-slate-800 uppercase tracking-widest">Esperando al Cliente</p>
                      <p class="text-[9px] text-slate-400 font-bold uppercase tracking-widest max-w-[220px]">El canal se activará cuando el cliente inicie la sesión.</p>
                    </div>
                    <button (click)="simulateChatRequest()" class="px-6 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-blue-600 transition-all shadow-lg cursor-pointer">
                       SIMULAR SOLICITUD
                    </button>
                  </div>
                } @else {
                  @for (msg of chatTranscript(); track $index) {
                    <div class="flex" [class.justify-end]="msg.user === 'SOPORTE'" [class.justify-start]="msg.user !== 'SOPORTE'">
                       <div class="max-w-[85%] space-y-1">
                          <div class="flex items-center gap-2 mb-0.5 px-1" [class.flex-row-reverse]="msg.user === 'SOPORTE'">
                             <span class="text-[7px] font-black uppercase tracking-widest text-slate-400">{{ msg.user }}</span>
                             <span class="text-[7px] font-bold text-slate-300 uppercase tracking-tighter">{{ msg.time }}</span>
                          </div>
                          <div [class]="msg.user === 'SOPORTE' ? 'bg-slate-900 text-white rounded-tr-none shadow-md' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-sm'"
                               class="px-4 py-3 rounded-2xl text-[11px] font-bold uppercase leading-relaxed break-words overflow-wrap-anywhere">
                             {{ msg.message }}
                          </div>
                       </div>
                    </div>
                  }
                }
              </div>

              <!-- Chat Footer (Sticky via flex shrink-0) -->
              @if (chatSessionStatus() === 'ACTIVE') {
                <footer class="px-6 py-4 border-t border-slate-100 shrink-0 bg-white">
                  <div class="relative">
                    <input type="text" #chatInput (keyup.enter)="sendMessage(chatInput.value); chatInput.value = ''"
                      placeholder="ESCRIBE AQUÍ..." 
                      class="w-full bg-slate-50 border-none rounded-xl px-6 py-3 text-[11px] font-bold text-slate-700 outline-none focus:ring-2 ring-blue-500/5 transition-all shadow-inner uppercase">
                    <button (click)="sendMessage(chatInput.value); chatInput.value = ''"
                      class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-900 text-white rounded-lg shadow-md hover:bg-blue-600 transition-all flex items-center justify-center">➤</button>
                  </div>
                </footer>
              }
            </div>
          </div>
        }

          <!-- Modal de Detalles del Cliente (Slide-over) -->
          @if (isClientDetailsVisible()) {
            <div class="fixed inset-0 z-[110] flex items-center justify-end animate-in fade-in duration-300">
              <div class="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" (click)="isClientDetailsVisible.set(false)"></div>
              <div class="relative bg-white w-[400px] h-full shadow-[-20px_0_60px_rgba(0,0,0,0.1)] border-l border-slate-100 flex flex-col animate-in slide-in-from-right duration-500">
                <header class="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <h3 class="text-[12px] font-black uppercase tracking-widest text-slate-900">Perfil del Cliente</h3>
                  <button (click)="isClientDetailsVisible.set(false)" class="text-slate-400 hover:text-slate-900 transition-all text-xl cursor-pointer">✕</button>
                </header>
                <div class="p-10 space-y-10 flex-1 overflow-y-auto custom-scrollbar">
                  <div class="flex flex-col items-center text-center space-y-4">
                    <div class="w-24 h-24 bg-blue-100 rounded-[2.5rem] flex items-center justify-center text-4xl shadow-xl text-blue-600">👤</div>
                    <div>
                      <p class="text-xl font-black text-slate-900 uppercase tracking-tight">{{ ticket()?.reporter?.name }}</p>
                      <p class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{{ ticket()?.reporter?.email }}</p>
                    </div>
                  </div>
                  
                  <div class="space-y-6">
                    <div class="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                       <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Empresa Vinculada</p>
                       <p class="text-[11px] font-black text-slate-800 uppercase">QDOORA CHILE SPA</p>
                    </div>
                    <div class="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                       <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Rol del Usuario</p>
                       <span class="px-3 py-1 bg-blue-600 text-white rounded-full text-[8px] font-black uppercase">ADMINISTRADOR</span>
                    </div>
                    <div class="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                       <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Última Actividad</p>
                       <p class="text-[11px] font-black text-slate-800 uppercase italic">Hace 15 minutos (Módulo Facturación)</p>
                    </div>
                    
                    @if (ticket()?.reporter?.id) {
                      <div class="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                         <p class="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Teléfono de Contacto</p>
                         <p class="text-[11px] font-black text-slate-800 uppercase flex items-center gap-2">
                           <span class="text-xs">📞</span> +56 9 8877 6655
                         </p>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          }

      </main>

      <!-- Modal de Previsualización (In-Situ) -->
      @if (previewingFile()) {
        <div class="fixed inset-0 z-[100] flex items-center justify-center p-12 animate-in fade-in duration-300">
           <!-- Backdrop -->
           <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" (click)="closePreview()"></div>
           
           <!-- Content Container -->
           <div class="relative bg-white w-full max-w-5xl max-h-full rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.4)] border border-slate-100 flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
              
              <!-- Header -->
              <header class="p-6 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
                 <div class="flex items-center gap-4">
                    <div class="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm text-xl">📎</div>
                    <div>
                       <p class="text-[10px] font-black uppercase tracking-widest text-slate-900">{{ previewingFile()?.name }}</p>
                       <p class="text-[8px] font-bold text-slate-400 uppercase tracking-tight mt-1">{{ (previewingFile()?.size || 0) / 1024 / 1024 | number:'1.1-1' }}MB • ARCHIVO DE SOPORTE</p>
                    </div>
                 </div>
                 <button (click)="closePreview()" class="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all text-xl cursor-pointer shadow-sm">✕</button>
              </header>

              <!-- Body (Preview Content) -->
              <div class="flex-1 overflow-y-auto p-8 flex items-center justify-center bg-slate-100/50 min-h-0">
                 @if (previewUrl()) {
                    @if (previewingFile()?.type?.startsWith('image/')) {
                       <img [src]="previewUrl()" class="max-w-full max-h-full rounded-xl shadow-2xl border border-white object-contain">
                    } @else if (previewingFile()?.type === 'application/pdf') {
                       <iframe [src]="previewUrl()" class="w-full h-full rounded-xl border border-slate-200 bg-white shadow-inner min-h-[600px]"></iframe>
                    } @else {
                       <div class="text-center space-y-6 max-w-sm py-12">
                          <div class="w-24 h-24 bg-white rounded-[2rem] border border-slate-200 flex items-center justify-center text-4xl mx-auto shadow-xl">📄</div>
                          <div class="space-y-2">
                             <p class="text-sm font-black uppercase tracking-widest text-slate-900">VISTA PREVIA NO DISPONIBLE</p>
                             <p class="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">ESTE TIPO DE ARCHIVO DEBE SER DESCARGADO PARA SU REVISIÓN DETALLADA.</p>
                          </div>
                          <a [href]="previewUrl()" [download]="previewingFile()?.name" class="inline-flex h-12 items-center px-10 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:-translate-y-1 transition-all no-underline">
                             DESCARGAR ARCHIVO
                          </a>
                       </div>
                    }
                 }
              </div>

              <!-- Footer -->
              <footer class="p-6 bg-white border-t border-slate-100 flex justify-end">
                 <button (click)="closePreview()" class="h-11 px-10 bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all cursor-pointer">
                    CERRAR VISTA
                 </button>
              </footer>
           </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    :host { display: block; height: 100%; }
  `]
})
export class TicketManagementComponent implements OnInit {
  private _route = inject(ActivatedRoute);
  private _ticketService = inject(TicketService);
  private _authService = inject(AuthService);

  ticket = signal<Ticket | null>(null);
  activeTab = signal('details');
  officialSolution = '';
  replyMessage: string = '';
  isInternal: boolean = false;
  replyStatus = signal<string>('IN_PROGRESS');
  previewUrl = signal<string | null>(null);
  notification = signal<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);

  // Core Functional Signals (Restored)
  selectedFiles: File[] = [];
  isReplyVisible = signal(false);
  previewingFile = signal<File | null>(null);

  // Live Chat Signals
  chatSessionStatus = signal<'NONE' | 'REQUESTED' | 'ACTIVE' | 'CLOSED'>('NONE');
  chatTranscript = signal<{ user: string, message: string, time: string }[]>([]);
  isClientDetailsVisible = signal(false);

  tabs = computed(() => {
    const baseTabs = [
      { id: 'details', label: 'DETALLES', icon: '📄' },
      { id: 'comments', label: 'COMENTARIOS', icon: '💬', count: this.ticket()?.interactions?.length || 0 }
    ];

    if (this._authService.isSupportRole()) {
      baseTabs.push({ id: 'forensic', label: 'TRAZABILIDAD TÉCNICA', icon: '🛡️' });

      if (this.chatSessionStatus() === 'REQUESTED' || this.chatSessionStatus() === 'ACTIVE') {
        baseTabs.push({ id: 'chat', label: 'CHAT EN VIVO', icon: '👥' });
      }
    }

    return baseTabs;
  });

  sortedInteractions = computed(() => {
    const interactions = this.ticket()?.interactions || [];
    return [...interactions].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });

  sortedTraceability = computed(() => {
    const logs = this.ticket()?.traceability || [];
    return [...logs].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });

  getEventActionLabel(action: string): string {
    const labels: Record<string, string> = {
      'created': 'TICKET CREADO INICIALMENTE',
      'updated_status': 'CAMBIO DE ESTADO OPERATIVO',
      'assigned': 'ASIGNACIÓN DE RESPONSABLE',
      'evidence_added': 'NUEVA EVIDENCIA ADJUNTA',
      'solution_added': 'REGISTRO DE SOLUCIÓN OFICIAL',
      'chat_started': 'SESIÓN DE CHAT INICIADA',
      'chat_ended': 'SESIÓN DE CHAT FINALIZADA'
    };
    if (!action) return 'EVENTO';
    return labels[action] || action.toUpperCase();
  }

  getChangedField(log: ForensicLog): string {
    if (log.action === 'updated_status') return 'ESTADO';
    if (log.action === 'assigned') return 'RESPONSABLE';

    const fieldMap: Record<string, string> = {
      'subject': 'ASUNTO',
      'description': 'DESCRIPCIÓN',
      'priority': 'PRIORIDAD',
      'type': 'TIPO',
      'status': 'ESTADO'
    };

    if (log.new_value) {
      const firstKey = Object.keys(log.new_value)[0];
      return fieldMap[firstKey] || firstKey?.toUpperCase() || 'GENERAL';
    }
    return 'SISTEMA';
  }

  formatTraceValue(val: any): string {
    if (!val) return 'INICIAL';

    // Si es un objeto (como lo guarda Laravel), extraemos el primer valor
    let rawValue = val;
    if (typeof val === 'object' && !Array.isArray(val)) {
      const keys = Object.keys(val);
      if (keys.length === 0) return 'VACÍO';
      rawValue = val[keys[0]];
    }

    if (rawValue === null || rawValue === undefined) return 'SIN ASIGNAR';

    // Mapeo de estados técnicos a etiquetas en español
    const labels: Record<string, string> = {
      'OPEN': 'ABIERTO',
      'IN_PROGRESS': 'EN PROGRESO',
      'PENDING_USER': 'PENDIENTE USUARIO',
      'RESOLVED': 'RESUELTO',
      'CLOSED': 'CERRADO'
    };

    return labels[rawValue] || rawValue.toString().toUpperCase();
  }

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
    this._ticketService.getTicketById(id).subscribe(t => {
      this.ticket.set(t);
      this.officialSolution = t.official_solution || '';
    });
  }

  selfAssign(): void {
    const t = this.ticket();
    if (!t) return;

    this._ticketService.assignTicket(t.id).subscribe({
      next: (updatedTicket) => {
        this.ticket.set(updatedTicket);
        // Recargar para ver trazabilidad actualizada
        this.loadTicket(t.id);
      },
      error: (err) => console.error('Error al asignar ticket:', err)
    });
  }

  saveChanges() {
    this.showNotification('Cambios guardados exitosamente.');
  }

  saveSolution() {
    if (!this.officialSolution.trim() || !this.ticket()) return;
    this._ticketService.updateStatus(this.ticket()!.id, this.ticket()!.status, 'Actualización de solución', this.officialSolution)
      .subscribe(() => this.showNotification('Solución guardada como borrador.', 'info'));
  }

  closeTicket() {
    if (!this.ticket() || this.ticket()?.status === 'CLOSED') return;

    if (!this.officialSolution.trim()) {
      this.showNotification('La solución oficial es obligatoria para cerrar el ticket.', 'error');
      return;
    }
    const solutionToArchive = this.officialSolution;
    this._ticketService.updateStatus(this.ticket()!.id, TicketStatus.CLOSED, 'Cierre de incidencia', solutionToArchive)
      .subscribe(() => {
        // Actualizar estado localmente para reflejar el cierre
        if (this.ticket()) {
          this.ticket.set({
            ...this.ticket()!,
            status: TicketStatus.CLOSED,
            official_solution: solutionToArchive
          });
        }

        // Archivar la solución como comentario final para el cliente
        this.addLocalInteraction(`--- SOLUCIÓN OFICIAL DEL TICKET ---\n\n${solutionToArchive}`, false);

        // Registrar en trazabilidad técnica el cierre
        this.addLocalForensicLog(
          'solution_added',
          'REGISTRO DE SOLUCIÓN OFICIAL',
          'EL AGENTE HA FINALIZADO LA GESTIÓN DEL TICKET.'
        );

        this.showNotification('Incidencia cerrada e indexada correctamente.');
        // Evitamos loadTicket() para no sobreescribir la interacción inyectada localmente en el mock
      });
  }

  onFileSelected(event: any) {
    const files = Array.from(event.target.files) as File[];
    const validFiles = files.filter(f => {
      const isLt5MB = f.size / 1024 / 1024 < 5;
      const isAllowedType = [
        'application/pdf', 'image/png', 'image/jpeg', 'image/jpg',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
      ].includes(f.type);
      return isLt5MB && isAllowedType;
    });

    if (this.selectedFiles.length + validFiles.length > 5) {
      this.showNotification('MÁXIMO 5 ARCHIVOS POR COMENTARIO.', 'error');
      return;
    }

    this.selectedFiles = [...this.selectedFiles, ...validFiles];
    event.target.value = ''; // Reset input
  }

  removeFile(index: number) {
    this.selectedFiles.splice(index, 1);
  }

  previewFile(file: File) {
    this.previewingFile.set(file);
    this.previewUrl.set(URL.createObjectURL(file));
  }

  closePreview() {
    if (this.previewUrl()) {
      URL.revokeObjectURL(this.previewUrl()!);
    }
    this.previewingFile.set(null);
    this.previewUrl.set(null);
  }

  sendReply() {
    if (!this.replyMessage.trim() || !this.ticket()) return;
    this._ticketService.addInteraction(
      this.ticket()!.id,
      this.replyMessage,
      this.isInternal,
      this.replyStatus()
    ).subscribe(() => {
      this.replyMessage = '';
      this.selectedFiles = [];
      this.isReplyVisible.set(false); // Ocultar tras enviar
      this.loadTicket(this.ticket()!.id);
    });
  }


  getPriorityClass(priority: string | undefined): string {
    switch (priority?.toUpperCase()) {
      case 'URGENT': return 'bg-red-50 text-red-600 border-red-100 shadow-sm shadow-red-50';
      case 'HIGH': return 'bg-orange-50 text-orange-600 border-orange-100 shadow-sm shadow-orange-50';
      case 'MEDIUM': return 'bg-blue-50 text-blue-600 border-blue-100 shadow-sm shadow-blue-50';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  }

  getStatusClass(status: string | undefined): string {
    switch (status?.toUpperCase()) {
      case 'OPEN': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'IN_PROGRESS': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'PENDING_USER': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'RESOLVED': return 'bg-green-50 text-green-600 border-green-100';
      case 'CLOSED': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  }
  showNotification(message: string, type: 'success' | 'error' | 'info' = 'success') {
    this.notification.set({ message, type });
    setTimeout(() => this.notification.set(null), 4000);
  }

  // Live Chat Methods
  simulateChatRequest() {
    this.chatSessionStatus.set('REQUESTED');
    this.showNotification('¡NUEVA SOLICITUD DE CHAT EN VIVO!', 'info');
  }

  startChat() {
    this.chatSessionStatus.set('ACTIVE');
    this.activeTab.set('chat');
    this.chatTranscript.set([
      { user: 'SISTEMA', message: 'EL AGENTE SE HA UNIDO AL CHAT.', time: new Date().toLocaleTimeString() },
      { user: 'CLIENTE', message: 'HOLA, NECESITO AYUDA CON LA FACTURA F-00892.', time: new Date().toLocaleTimeString() }
    ]);

    // Registrar en trazabilidad técnica (Simulación local)
    this.addLocalForensicLog(
      'chat_started',
      'SESIÓN DE CHAT INICIADA',
      'EL AGENTE HA ABIERTO EL CANAL DE COMUNICACIÓN EN VIVO CON EL CLIENTE.'
    );

    this._ticketService.addForensicLog(
      this.ticket()!.id,
      'chat_started',
      'SESIÓN DE CHAT INICIADA',
      'EL AGENTE HA ABIERTO EL CANAL DE COMUNICACIÓN EN VIVO CON EL CLIENTE.'
    ).subscribe();
  }

  sendMessage(msg: string) {
    if (!msg.trim()) return;
    this.chatTranscript.update(t => [...t, { user: 'SOPORTE', message: msg, time: new Date().toLocaleTimeString() }]);
  }

  viewClientDetails() {
    this.isClientDetailsVisible.set(true);
  }

  closeChatSession() {
    if (!this.ticket()) return;

    // Generar resumen del chat para la trazabilidad
    const transcript = this.chatTranscript().map(m => `[${m.time}] ${m.user}: ${m.message}`).join('\n');

    // Agregar como interacción (Simulación local)
    this.addLocalInteraction(
      `--- RESUMEN DE CHAT FINALIZADO ---\n\n${transcript}`,
      true
    );

    // Agregar como interacción (archivado)
    this._ticketService.addInteraction(
      this.ticket()!.id,
      `--- RESUMEN DE CHAT FINALIZADO ---\n\n${transcript}`,
      true // Interna
    ).subscribe(() => {
      this.chatSessionStatus.set('CLOSED');

      // Registrar en trazabilidad técnica el fin del chat (Simulación local)
      this.addLocalForensicLog(
        'chat_ended',
        'SESIÓN DE CHAT FINALIZADA',
        'SE HA CERRADO EL CANAL DE CHAT Y SE HA ARCHIVADO LA TRANSCRIPCIÓN EN LAS INTERACCIONES.'
      );

      this._ticketService.addForensicLog(
        this.ticket()!.id,
        'chat_ended',
        'SESIÓN DE CHAT FINALIZADA',
        'SE HA CERRADO EL CANAL DE CHAT Y SE HA ARCHIVADO LA TRANSCRIPCIÓN EN LAS INTERACCIONES.'
      ).subscribe(() => {
        this.showNotification('CHAT FINALIZADO Y ARCHIVADO EN TRAZABILIDAD.');
        this.activeTab.set('comments');
      });
    });
  }

  private addLocalForensicLog(action: string, event_label: string, description: string) {
    const currentTicket = this.ticket();
    if (!currentTicket) return;

    const newLog: any = {
      id: Math.floor(Math.random() * 10000),
      action,
      description,
      user: { id: 1, name: 'SOPORTE NIVEL 1', email: '', role: 'agent' },
      created_at: new Date().toISOString(),
      metadata: { ip: '192.168.65.1', event_label }
    };

    const updatedTraceability = [newLog, ...(currentTicket.traceability || [])];

    // Persistir en el servicio para que sobreviva a recargas del componente
    this._ticketService.addSimulatedTraceability(currentTicket.id, newLog);

    this.ticket.set({
      ...currentTicket,
      traceability: updatedTraceability
    });
  }

  private addLocalInteraction(message: string, isInternal: boolean) {
    const currentTicket = this.ticket();
    if (!currentTicket) return;

    const newInteraction: any = {
      id: Math.floor(Math.random() * 10000),
      message,
      is_internal: isInternal,
      created_at: new Date().toISOString(),
      user: { id: 1, name: 'SOPORTE NIVEL 1', email: '', role: 'agent' }
    };

    const updatedInteractions = [newInteraction, ...(currentTicket.interactions || [])];

    // Persistir en el servicio para que sobreviva a recargas del componente
    this._ticketService.addSimulatedInteraction(currentTicket.id, newInteraction);

    this.ticket.set({
      ...currentTicket,
      interactions: updatedInteractions
    });
  }
}
