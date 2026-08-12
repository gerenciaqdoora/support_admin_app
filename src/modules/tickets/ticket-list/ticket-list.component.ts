import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { TicketService } from '@core/services/ticket.service';
import { Ticket, TicketPriority, TicketStatus, LoggerEvent } from '@core/models/support.models';
import { AuthService } from '@core/services/auth.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet],
  template: `
    <div class="flex h-full bg-white overflow-hidden min-h-0">
      <!-- 1. Sidebar Compacto -->
      <aside class="w-64 bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
        <div class="p-4">
          <button routerLink="/tickets/create" 
            class="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-wider shadow-sm hover:bg-blue-700 transition-all active:scale-95 cursor-pointer">
            + NUEVO TICKET
          </button>
        </div>

        <nav class="flex-1 px-3 space-y-0.5 overflow-y-auto custom-scrollbar">
          <h3 class="px-3 text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 mt-2">Bandejas</h3>
          
          <button (click)="filter('ALL')" 
            [class.bg-blue-50]="activeFilter() === 'ALL'"
            [class.text-blue-700]="activeFilter() === 'ALL'"
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-200/50 transition-all group cursor-pointer">
            <span class="text-base">📥</span>
            <span class="text-[11px] font-bold tracking-tight flex-1 text-left uppercase">TODOS LOS TICKETS</span>
          </button>

          <button (click)="filter('MINE')" 
            [class.bg-blue-50]="activeFilter() === 'MINE'"
            [class.text-blue-700]="activeFilter() === 'MINE'"
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-200/50 transition-all group cursor-pointer">
            <span class="text-base">👤</span>
            <span class="text-[11px] font-bold tracking-tight flex-1 text-left uppercase">MIS TICKETS</span>
          </button>

          <button (click)="filter('UNASSIGNED')" 
            [class.bg-blue-50]="activeFilter() === 'UNASSIGNED'"
            [class.text-blue-700]="activeFilter() === 'UNASSIGNED'"
            class="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-200/50 transition-all group cursor-pointer">
            <span class="text-base opacity-40">👤❌</span>
            <span class="text-[11px] font-bold tracking-tight flex-1 text-left uppercase">NO ASIGNADOS</span>
            <span class="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[9px] font-black">{{ unassignedTicketsCount() }}</span>
          </button>

          <div class="pt-6 pb-2 px-3">
            <h3 class="text-[9px] font-black text-slate-400 uppercase tracking-widest">PRIORIDADES</h3>
          </div>

          <div class="px-2 space-y-0.5">
            <button (click)="filterByPriority('URGENT')" 
              [class.bg-blue-50]="activeFilter() === 'PRIORITY_URGENT'"
              class="w-full flex items-center gap-2.5 px-4 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200/50 transition-all cursor-pointer group">
              <svg class="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <span class="text-[10px] font-bold uppercase tracking-tight flex-1 text-left">URGENTE</span>
              <span class="text-[9px] font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{{ priorityCounts().URGENT }}</span>
            </button>
            <button (click)="filterByPriority('HIGH')" 
              [class.bg-blue-50]="activeFilter() === 'PRIORITY_HIGH'"
              class="w-full flex items-center gap-2.5 px-4 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200/50 transition-all cursor-pointer group">
              <svg class="w-3.5 h-3.5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
              <span class="text-[10px] font-bold uppercase tracking-tight flex-1 text-left">ALTA</span>
              <span class="text-[9px] font-black text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">{{ priorityCounts().HIGH }}</span>
            </button>
            <button (click)="filterByPriority('MEDIUM')" 
              [class.bg-blue-50]="activeFilter() === 'PRIORITY_MEDIUM'"
              class="w-full flex items-center gap-2.5 px-4 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200/50 transition-all cursor-pointer group">
              <svg class="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M20 12H4"></path>
              </svg>
              <span class="text-[10px] font-bold uppercase tracking-tight flex-1 text-left">MEDIA</span>
              <span class="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{{ priorityCounts().MEDIUM }}</span>
            </button>
            <button (click)="filterByPriority('LOW')" 
              [class.bg-blue-50]="activeFilter() === 'PRIORITY_LOW'"
              class="w-full flex items-center gap-2.5 px-4 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200/50 transition-all cursor-pointer group">
              <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"></path>
              </svg>
              <span class="text-[10px] font-bold uppercase tracking-tight flex-1 text-left">BAJA</span>
              <span class="text-[9px] font-black text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded">{{ priorityCounts().LOW }}</span>
            </button>
          </div>

          <div class="pt-6 pb-2 px-3">
            <h3 class="text-[9px] font-black text-slate-400 uppercase tracking-widest">ESTADOS</h3>
          </div>

          <div class="px-2 space-y-0.5">
            <button (click)="filterByStatus('OPEN')" 
              [class.bg-blue-50]="activeFilter() === 'STATUS_OPEN'"
              class="w-full flex items-center gap-2.5 px-4 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200/50 transition-all cursor-pointer group">
              <svg class="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <span class="text-[10px] font-bold uppercase tracking-tight flex-1 text-left">ABIERTO</span>
              <span class="text-[9px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">{{ statusCounts().OPEN }}</span>
            </button>
            <button (click)="filterByStatus('IN_PROGRESS')" 
              [class.bg-blue-50]="activeFilter() === 'STATUS_IN_PROGRESS'"
              class="w-full flex items-center gap-2.5 px-4 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200/50 transition-all cursor-pointer group">
              <svg class="w-3.5 h-3.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              <span class="text-[10px] font-bold uppercase tracking-tight flex-1 text-left">EN PROGRESO</span>
              <span class="text-[9px] font-black text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">{{ statusCounts().IN_PROGRESS }}</span>
            </button>
            <button (click)="filterByStatus('PENDING_USER')" 
              [class.bg-blue-50]="activeFilter() === 'STATUS_PENDING_USER'"
              class="w-full flex items-center gap-2.5 px-4 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200/50 transition-all cursor-pointer group">
              <svg class="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
              <span class="text-[10px] font-bold uppercase tracking-tight flex-1 text-left">PENDIENTE USUARIO</span>
              <span class="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{{ statusCounts().PENDING_USER }}</span>
            </button>
            <button (click)="filterByStatus('RESOLVED')" 
              [class.bg-blue-50]="activeFilter() === 'STATUS_RESOLVED'"
              class="w-full flex items-center gap-2.5 px-4 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200/50 transition-all cursor-pointer group">
              <svg class="w-3.5 h-3.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <span class="text-[10px] font-bold uppercase tracking-tight flex-1 text-left">RESUELTO</span>
              <span class="text-[9px] font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded">{{ statusCounts().RESOLVED }}</span>
            </button>
            <button (click)="filterByStatus('CLOSED')" 
              [class.bg-blue-50]="activeFilter() === 'STATUS_CLOSED'"
              class="w-full flex items-center gap-2.5 px-4 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200/50 transition-all cursor-pointer group">
              <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
              <span class="text-[10px] font-bold uppercase tracking-tight flex-1 text-left">CERRADO</span>
              <span class="text-[9px] font-black text-slate-600 bg-slate-50 px-1.5 py-0.5 rounded">{{ statusCounts().CLOSED }}</span>
            </button>
          </div>

          <div class="pt-6 pb-2 px-3 flex items-center justify-between">
            <h3 class="text-[9px] font-black text-slate-400 uppercase tracking-widest">ETIQUETAS</h3>
          </div>

          <div class="px-2 space-y-0.5">
            @for (tag of availableTags(); track tag) {
              <button class="w-full flex items-center gap-2.5 px-4 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200/50 transition-all cursor-pointer group">
                <span class="w-1.5 h-1.5 rounded-full group-hover:scale-125 transition-transform" [class]="getTagColor(tag)"></span>
                <span class="text-[10px] font-bold uppercase tracking-tight">{{ tag }}</span>
              </button>
            }
          </div>
        </nav>

        <div class="p-4 border-t border-slate-200 bg-white/50 group relative">
          <div class="flex items-center justify-between cursor-help">
             <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">SLA PROMEDIO</span>
             <span class="text-[11px] font-black text-slate-700">2.4H</span>
          </div>
          
          <!-- Tooltip / Hover details -->
          <div class="absolute bottom-full left-2 right-2 mb-2 p-3 bg-slate-900 text-white rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all pointer-events-none z-[100] border border-white/10">
            <h4 class="text-[10px] font-black uppercase tracking-widest mb-2 text-blue-400">MÉTRICAS DE RENDIMIENTO</h4>
            <div class="space-y-2">
              <div class="flex justify-between items-center border-b border-white/5 pb-1">
                <span class="text-[8px] font-bold uppercase opacity-60">PRIMERA RESPUESTA</span>
                <span class="text-[9px] font-black">45M</span>
              </div>
              <div class="flex justify-between items-center border-b border-white/5 pb-1">
                <span class="text-[8px] font-bold uppercase opacity-60">RESOLUCIÓN TOTAL</span>
                <span class="text-[9px] font-black">2.4H</span>
              </div>
              <div class="mt-2 pt-1">
                <p class="text-[7.5px] font-bold text-blue-300 uppercase tracking-tight leading-tight italic">
                  OBJETIVO ERP: MANTENER EL PROMEDIO BAJO LAS 4 HORAS PARA GARANTIZAR LA EXCELENCIA OPERATIVA.
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- 2. Lista de Tickets (Inbox Ultra-Compact) -->
      <main [class.flex-1]="!selectedTicketId() && !isCreatingTicket()" 
            [class.w-[420px]]="selectedTicketId() || isCreatingTicket()"
            class="bg-slate-50 border-r border-slate-200 flex flex-col shrink-0 overflow-hidden relative">
        
        <!-- Search Header Compact -->
        <div class="p-3 border-b border-slate-200 bg-white/50 backdrop-blur-sm">
          <div class="relative">
            <input type="text" 
              (input)="searchQuery.set(t.value)" #t 
              placeholder="BUSCAR TICKET..." 
              class="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-300 shadow-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none text-[11px] font-bold text-slate-800 uppercase tracking-tight transition-all placeholder:text-slate-400">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 opacity-60 text-[12px]">🔍</span>
          </div>
        </div>

        <!-- List Area -->
        <div class="flex-1 overflow-y-auto divide-y divide-slate-300 custom-scrollbar">
          @if (ticketService.isLoading()) {
            <div class="p-10 flex flex-col items-center opacity-30">
              <div class="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p class="text-[9px] font-black uppercase tracking-widest">CARGANDO...</p>
            </div>
          } @for (ticket of filteredTickets(); track ticket.id) {
            <div 
              [routerLink]="['/tickets', ticket.id]"
              [class.bg-slate-100/50]="selectedTicketId() === ticket.id"
              [class.shadow-md]="selectedTicketId() === ticket.id"
              [class.z-10]="selectedTicketId() === ticket.id"
              class="group flex items-center justify-between px-3 py-2.5 border-b border-slate-300 bg-white/60 hover:bg-white hover:shadow-lg hover:shadow-slate-300/40 hover:z-20 transition-all duration-300 cursor-pointer relative"
              [class.border-l-4]="selectedTicketId() === ticket.id"
              [class.border-l-blue-600]="selectedTicketId() === ticket.id">
              
              <div class="flex flex-col gap-0.5 min-w-0">
                <!-- Header: ID & Type & Agent -->
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-[10px] font-medium text-slate-400 tracking-wider uppercase">{{ ticket.code }}</span>
                  <span [class]="getTypeBadgeClass(ticket)" class="px-1 py-0.5 rounded text-[9px] font-black flex items-center gap-1 border border-transparent bg-opacity-5 uppercase tracking-tighter">
                    {{ ticket.metadata?.event_id ? '⚡ AUTO' : 'TICKET' }}
                  </span>

                  <span [class]="getStatusBadgeClass(ticket.status)" class="px-1.5 py-0.5 rounded text-[8px] font-black border uppercase tracking-widest">
                    {{ getStatusLabel(ticket.status) }}
                  </span>

                  <!-- Assigned Agent (Move to top) -->
                  <div class="group/tooltip relative flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[8px] font-black uppercase tracking-tight cursor-help">
                    <span class="text-[7px] text-slate-400">AGENTE:</span>
                    <span class="opacity-70">🛠️</span>
                    <span [class.text-slate-400]="!ticket.assignee" [class.text-slate-800]="ticket.assignee">
                      {{ ticket.assignee?.name || 'SIN ASIGNAR' }}
                    </span>
                    
                    <!-- Tooltip (Downwards to avoid clipping) -->
                    <div class="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-32 p-2 bg-slate-800 text-white text-[7px] leading-tight rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-white/10 text-center">
                      RESPONSABLE TÉCNICO ASIGNADO PARA RESOLVER ESTE TICKET
                      <div class="absolute bottom-full left-1/2 -translate-x-1/2 border-8 border-transparent border-b-slate-800"></div>
                    </div>
                  </div>
                </div>

                <!-- Body: Title & Desc -->
                <div class="min-w-0 leading-tight mt-1">
                  <h3 class="text-[13px] font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors uppercase">
                    {{ ticket.subject }}
                  </h3>
                  <p class="text-[9px] text-slate-400 truncate uppercase">
                    {{ ticket.description }}
                  </p>
                </div>

                <!-- Footer Meta -->
                <div class="flex items-center gap-3 mt-1.5">
                  <!-- Priority Pill -->
                  <span [class]="getPriorityBadgeClass(ticket.priority)" class="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-transparent bg-opacity-10 transition-all">
                    @switch (ticket.priority) {
                      @case ('URGENT') {
                        <svg class="w-2.5 h-2.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                      }
                      @case ('HIGH') {
                        <svg class="w-2.5 h-2.5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                      }
                      @case ('MEDIUM') {
                        <svg class="w-2.5 h-2.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5" d="M20 12H4"></path></svg>
                      }
                      @default {
                        <svg class="w-2.5 h-2.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"></path></svg>
                      }
                    }
                    {{ getPriorityLabel(ticket.priority) }}
                  </span>

                  <!-- SLA with Dynamic Status -->
                  <div class="flex items-center gap-1.5 px-1.5 py-0.5 rounded border border-transparent transition-all"
                       [class.bg-red-50]="getSLAStatus(ticket) === 'BREACHED'"
                       [class.text-red-600]="getSLAStatus(ticket) === 'BREACHED'"
                       [class.border-red-100]="getSLAStatus(ticket) === 'BREACHED'"
                       [class.bg-amber-50]="getSLAStatus(ticket) === 'AT_RISK'"
                       [class.text-amber-600]="getSLAStatus(ticket) === 'AT_RISK'"
                       [class.border-amber-100]="getSLAStatus(ticket) === 'AT_RISK'"
                       [class.text-slate-300]="getSLAStatus(ticket) === 'ON_TRACK'">
                    <svg class="w-2.5 h-2.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span class="text-[9px] font-black tracking-tight uppercase">SLA {{ getSLALabel(ticket) }}</span>
                  </div>

                  <!-- Reporter User (👤) -->
                  <div class="group/tooltip relative flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-[8px] font-black uppercase tracking-tight cursor-help">
                    <span class="text-[7px] text-blue-400">USUARIO:</span>
                    <span class="opacity-70">👤</span>
                    <span class="text-blue-700">{{ ticket.reporter?.name }}</span>
                    <span class="text-blue-500">#{{ ticket.reporter?.id }}</span>

                    <!-- Tooltip -->
                    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-32 p-2 bg-blue-600 text-white text-[7px] leading-tight rounded-lg opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl border border-blue-500/10 text-center">
                      USUARIO QUE SOLICITÓ EL SOPORTE TÉCNICO
                      <div class="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-blue-600"></div>
                    </div>
                  </div>

                  @if (ticket.related_documents?.length) {
                    <span class="text-[10px] text-slate-300 font-medium italic truncate max-w-[80px]">
                      {{ ticket.related_documents[0].code }}
                    </span>
                  }
                </div>
              </div>

               <!-- Right Side: Time & Action -->
              <div class="flex flex-col items-end gap-2 self-start pt-0.5">
                <div class="text-[10px] text-slate-300 whitespace-nowrap font-medium italic">
                  hace {{ ticket.id % 24 }}h
                </div>
                <button [routerLink]="['/tickets', ticket.id, 'manage']" 
                        (click)="$event.stopPropagation()"
                        class="px-2 py-1 bg-slate-900 text-white rounded text-[8px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-sm active:scale-95 cursor-pointer opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                  Gestionar
                </button>
              </div>
            </div>
          } @empty {
            <div class="p-12 text-center py-20 flex flex-col items-center">
              <span class="text-3xl mb-4 grayscale opacity-20">📭</span>
              <p class="text-[10px] font-black text-slate-300 uppercase tracking-widest">Bandeja Vacía</p>
            </div>
          }
        </div>
      </main>

      <!-- 3. Detalle (View Pane) -->
      <section [class.flex-1]="selectedTicketId() || isCreatingTicket()"
               [class.hidden]="!selectedTicketId() && !isCreatingTicket()"
               class="bg-[#fcfdfe] flex flex-col relative overflow-hidden transition-all duration-500 border-l border-slate-100">
        @if (selectedTicketId() || isCreatingTicket()) {
          @defer (on timer(20ms)) {
            <div class="h-full animate-in fade-in duration-300">
              <router-outlet></router-outlet>
            </div>
          } @placeholder {
            <div class="flex-1 flex items-center justify-center p-10 opacity-20">
               <div class="w-6 h-6 border-2 border-slate-300 border-t-slate-800 rounded-full animate-spin"></div>
            </div>
          }
        }
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
  `]
})
export class TicketListComponent implements OnInit {
  ticketService = inject(TicketService);
  authService = inject(AuthService);
  router = inject(Router);

  activeFilter = signal<string>('ALL');
  searchQuery = signal<string>('');
  selectedTicketId = signal<number | null>(null);
  isCreatingTicket = signal<boolean>(false);

  filteredTickets = computed(() => {
    let tickets = this.ticketService.tickets();
    const filter = this.activeFilter();
    const query = this.searchQuery().toLowerCase();

    // Filtro por tipo
    if (filter === 'OPEN') {
      tickets = tickets.filter(t => t.status === TicketStatus.OPEN);
    } else if (filter === 'MINE') {
      const myId = this.authService.currentUser()?.id;
      tickets = tickets.filter(t => t.assignee_id === myId);
    } else if (filter === 'UNASSIGNED') {
      tickets = tickets.filter(t => !t.assignee_id);
    } else if (filter === 'RESOLVED') {
      tickets = tickets.filter(t => t.status === TicketStatus.RESOLVED);
    }

    // Filtro por búsqueda
    if (query) {
      tickets = tickets.filter(t =>
        t.subject.toLowerCase().includes(query) ||
        t.code.toLowerCase().includes(query)
      );
    }

    // Filtro por prioridad
    if (filter.startsWith('PRIORITY_')) {
      const p = filter.replace('PRIORITY_', '');
      tickets = tickets.filter(t => t.priority === p);
    }
    // Filtro por estado
    if (filter.startsWith('STATUS_')) {
      const s = filter.replace('STATUS_', '');
      tickets = tickets.filter(t => t.status === s);
    }

    return tickets;
  });

  // signals de Conteo y Filtrado
  myTicketsCount = computed(() => {
    const myId = this.authService.currentUser()?.id;
    return this.ticketService.tickets().filter(t => t.assignee_id === myId).length;
  });

  unassignedTicketsCount = computed(() =>
    this.ticketService.tickets().filter(t => !t.assignee_id).length
  );

  urgentTicketsCount = computed(() =>
    this.ticketService.tickets().filter(t => t.priority === 'URGENT').length
  );

  openTicketsCount = computed(() =>
    this.ticketService.tickets().filter(t => t.status === TicketStatus.OPEN).length
  );

  priorityCounts = computed(() => {
    const tickets = this.ticketService.tickets().filter(t => t.status !== TicketStatus.CLOSED);
    return {
      URGENT: tickets.filter(t => t.priority === TicketPriority.URGENT).length,
      HIGH: tickets.filter(t => t.priority === TicketPriority.HIGH).length,
      MEDIUM: tickets.filter(t => t.priority === TicketPriority.MEDIUM).length,
      LOW: tickets.filter(t => t.priority === TicketPriority.LOW).length,
    };
  });

  statusCounts = computed(() => {
    const tickets = this.ticketService.tickets();
    return {
      OPEN: tickets.filter(t => t.status === TicketStatus.OPEN).length,
      IN_PROGRESS: tickets.filter(t => t.status === TicketStatus.IN_PROGRESS).length,
      PENDING_USER: tickets.filter(t => t.status === TicketStatus.PENDING_USER).length,
      RESOLVED: tickets.filter(t => t.status === TicketStatus.RESOLVED).length,
      CLOSED: tickets.filter(t => t.status === TicketStatus.CLOSED).length,
    };
  });

  // etiquetas Dinámicas filtradas por uso real
  availableTags = computed(() => {
    const tickets = this.ticketService.tickets();
    const usedTagNames = new Set<string>();
    
    tickets.forEach(ticket => {
      ticket.tags?.forEach(tag => usedTagNames.add(tag.name.toUpperCase()));
    });

    // Retornamos solo los LoggerEvent que están siendo usados
    return Object.values(LoggerEvent).filter(event => 
      usedTagNames.has(event.toUpperCase())
    );
  });

  getTagColor(tag: string): string {
    const t = tag.toUpperCase();
    if (t.includes('ADUANA')) return 'bg-purple-400';
    if (t.includes('NOMINA') || t.includes('LIQUIDACION')) return 'bg-green-400';
    if (t.includes('FACTURA') || t.includes('VENTA')) return 'bg-blue-400';
    if (t.includes('SISTEMA') || t.includes('ERROR')) return 'bg-red-400';
    if (t.includes('USUARIO') || t.includes('EMPLEADO')) return 'bg-amber-400';
    return 'bg-slate-400'; // Default
  }

  filterByPriority(priority: string) {
    this.activeFilter.set(`PRIORITY_${priority}`);
  }

  filterByStatus(status: string) {
    this.activeFilter.set(`STATUS_${status}`);
  }

  getSLAStatus(ticket: Ticket): 'BREACHED' | 'AT_RISK' | 'ON_TRACK' {
    if (!ticket.sla_limit_at) return 'ON_TRACK';
    const limit = new Date(ticket.sla_limit_at).getTime();
    const now = new Date().getTime();
    const diff = limit - now;

    if (diff < 0) return 'BREACHED';
    if (diff < 3600000) return 'AT_RISK'; // Menos de 1 hora
    return 'ON_TRACK';
  }

  getSLALabel(ticket: Ticket): string {
    const status = this.getSLAStatus(ticket);
    switch (status) {
      case 'BREACHED': return 'VENCIDO';
      case 'AT_RISK': return 'EN RIESGO';
      default: return 'EN TIEMPO';
    }
  }

  ngOnInit() {
    this.ticketService.getTickets().subscribe();

    // Detectar ticket seleccionado desde la URL (solo al terminar la navegación)
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this._updateSelectedTicketFromUrl();
    });

    // Carga inicial
    this._updateSelectedTicketFromUrl();
  }

  private _updateSelectedTicketFromUrl() {
    const urlParts = this.router.url.split('?')[0].split('/');
    const ticketIdx = urlParts.indexOf('tickets');

    if (ticketIdx !== -1 && urlParts[ticketIdx + 1]) {
      const param = urlParts[ticketIdx + 1];
      if (param === 'create') {
        this.isCreatingTicket.set(true);
        this.selectedTicketId.set(null);
      } else {
        const id = parseInt(param);
        if (!isNaN(id)) {
          this.selectedTicketId.set(id);
          this.isCreatingTicket.set(false);
        } else {
          this.selectedTicketId.set(null);
          this.isCreatingTicket.set(false);
        }
      }
    } else {
      this.selectedTicketId.set(null);
      this.isCreatingTicket.set(false);
    }
  }

  filter(type: string) {
    this.activeFilter.set(type);
  }

  assignMe(id: number) {
    this.ticketService.assignTicket(id).subscribe({
      next: () => {
        this.ticketService.getTickets().subscribe();
      }
    });
  }

  getPriorityBadgeClass(priority: string | undefined): string {
    switch (priority?.toUpperCase()) {
      case 'URGENT':
      case 'CRITICAL':
        return 'bg-red-50 text-red-600 border-red-100';
      case 'HIGH':
        return 'bg-orange-50 text-orange-600 border-orange-100';
      case 'MEDIUM':
        return 'bg-blue-50 text-blue-600 border-blue-100';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  }

  getPriorityIcon(priority: string | undefined): string {
    switch (priority?.toUpperCase()) {
      case 'URGENT':
      case 'CRITICAL': return '🔥';
      case 'HIGH': return '⚠️';
      case 'MEDIUM': return '🔵';
      default: return '⚪';
    }
  }

  getTypeBadgeClass(ticket: any): string {
    if (ticket.metadata?.event_id) {
      return 'bg-blue-50 text-blue-600 border-blue-100 uppercase';
    }
    return 'bg-green-50 text-green-600 border-green-100 uppercase';
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

  getStatusBadgeClass(status: string | undefined): string {
    switch (status?.toUpperCase()) {
      case 'OPEN': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'IN_PROGRESS': return 'bg-purple-50 text-purple-600 border-purple-100';
      case 'PENDING_USER': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'RESOLVED': return 'bg-green-50 text-green-600 border-green-100';
      case 'CLOSED': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  }

  getStatusLabel(status: string | undefined): string {
    switch (status?.toUpperCase()) {
      case 'OPEN': return 'ABIERTO';
      case 'IN_PROGRESS': return 'EN PROGRESO';
      case 'PENDING_USER': return 'PENDIENTE USUARIO';
      case 'RESOLVED': return 'RESUELTO';
      case 'CLOSED': return 'CERRADO';
      default: return status || '';
    }
  }
}
