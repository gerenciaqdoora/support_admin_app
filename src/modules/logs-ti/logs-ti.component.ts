import { Component, OnInit, inject, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LoggerService, LoggerData, PaginatedLogs, LogUser, ChartStat } from '@core/services/logger.service';

@Component({
  selector: 'app-logs-ti',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col bg-[#f8fafc] text-slate-800 overflow-hidden font-sans">
      <!-- Header de Dashboard Premium Compacto -->
      <div class="bg-white border-b border-slate-200 px-8 py-3 flex justify-between items-center shrink-0 z-50 shadow-sm relative">
        <div class="flex items-center gap-5">
          <div class="relative">
            <div class="w-1.5 h-10 bg-blue-600 rounded-full"></div>
            <div class="absolute inset-0 bg-blue-600 blur-lg opacity-20"></div>
          </div>
          <div>
            <div class="flex items-center gap-4">
              <h1 class="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">Explorador de Logs</h1>
              <div class="flex items-center gap-1.5 ml-4">
                <button 
                  (click)="showFilters.set(!showFilters())" 
                  [class]="showFilters() ? 'bg-blue-600 text-white border-blue-500' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'"
                  class="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  {{ showFilters() ? 'Ocultar Filtros' : 'Mostrar Filtros' }}
                </button>
                <button 
                  (click)="showChart.set(!showChart())" 
                  [class]="showChart() ? 'bg-blue-600 text-white border-blue-500' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'"
                  class="flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  {{ showChart() ? 'Ocultar Gráfico' : 'Mostrar Gráfico' }}
                </button>
              </div>
            </div>
            <div class="flex items-center gap-2 mt-2">
               <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
               <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Auditoría Forense en Tiempo Real</p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-8">
           <div class="flex flex-col items-end">
              <span class="text-sm font-black text-slate-900 uppercase tracking-tighter">{{ logsData()?.total || 0 }}</span>
              <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">Total Eventos</span>
           </div>
           <div class="w-px h-10 bg-slate-100"></div>
           <div class="flex items-center gap-3 px-4 py-2 bg-blue-50 rounded-2xl border border-blue-100/50">
             <div class="flex flex-col">
               <span class="text-[10px] font-black text-blue-700 uppercase leading-none">Health Check</span>
               <span class="text-[8px] font-bold text-blue-400 uppercase tracking-widest mt-1">SISTEMA OPERATIVO</span>
             </div>
             <div class="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
           </div>
        </div>
      </div>

      <!-- Barra de Filtros Dinámica -->
      @if (showFilters()) {
        <div class="bg-white border-b border-slate-200 px-8 py-3 flex items-center gap-x-4 shrink-0 z-40 shadow-sm animate-in slide-in-from-top-2 duration-300 w-full">
            
            <!-- 1. Nivel de Logs -->
            <div class="flex flex-col gap-2 flex-1 min-w-0 relative">
              <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nivel de Logs</span>
              <div 
                (click)="toggleDropdown('severity', $event)"
                class="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-2.5 text-[10px] font-black text-slate-700 cursor-pointer flex justify-between items-center hover:bg-white hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/5 shadow-sm transition-all min-h-[44px] group antialiased tracking-tight"
              >
                <span [class]="getSeverityLabelClass(filters.type)">{{ selectedSeverityLabel }}</span>
                <svg class="h-4 w-4 text-slate-300 transition-transform group-hover:text-blue-500" [class.rotate-180]="activeDropdown() === 'severity'" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
              @if (activeDropdown() === 'severity') {
                <div class="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-[24px] mt-3 shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[60] animate-in slide-in-from-top-3 overflow-hidden ring-1 ring-slate-900/5">
                <div class="py-2">
                  <div (click)="selectSeverity('')" class="mx-2 px-4 py-3 text-[10px] font-black text-slate-400 hover:bg-slate-50 cursor-pointer rounded-xl transition-colors uppercase tracking-widest border-b border-slate-50 mb-1">Todos los Niveles</div>
                  @for (s of severities; track s.id) {
                    <div (click)="selectSeverity(s.id)" class="mx-2 px-4 py-3.5 hover:bg-blue-50 cursor-pointer transition-all rounded-xl group relative overflow-hidden">
                       <span [class]="getSeverityLabelClass(s.id)" class="relative z-10 text-[10px]">{{ s.label }}</span>
                       <div class="absolute inset-y-0 left-0 w-1 bg-blue-600 -translate-x-full group-hover:translate-x-0 transition-transform"></div>
                    </div>
                  }
                </div>
                </div>
              }
            </div>

            <!-- 2. Recurso / Evento -->
            <div class="flex flex-col gap-2 flex-[1.2] min-w-0 relative">
              <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Recurso / Evento</span>
              <div 
                (click)="toggleDropdown('event', $event)"
                class="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-2.5 text-[10px] font-black text-slate-700 cursor-pointer flex justify-between items-center hover:bg-white hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/5 shadow-sm transition-all min-h-[44px] group antialiased tracking-tight"
              >
                <span class="truncate uppercase">{{ selectedEventLabel }}</span>
                <svg class="h-4 w-4 text-slate-300 transition-transform group-hover:text-blue-500" [class.rotate-180]="activeDropdown() === 'event'" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
              @if (activeDropdown() === 'event') {
                <div class="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-[24px] mt-3 shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[60] animate-in slide-in-from-top-3 overflow-hidden flex flex-col max-h-[380px] ring-1 ring-slate-900/5">
                  <div class="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div class="relative group">
                      <input type="text" [(ngModel)]="eventSearch" (click)="$event.stopPropagation()" placeholder="Buscar..." class="w-full bg-white border border-slate-200 rounded-2xl px-11 py-2.5 text-[11px] font-black outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm">
                      <svg class="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke-width="2.5"/></svg>
                    </div>
                  </div>
                  <div class="overflow-y-auto custom-scrollbar flex-1 py-2">
                    <div (click)="selectEvent('')" class="mx-2 px-4 py-3 text-[10px] hover:bg-slate-50 cursor-pointer font-black text-slate-400 uppercase tracking-widest rounded-xl transition-colors">Cualquier Recurso</div>
                    @for (ev of filteredEvents(); track ev) {
                      <div (click)="selectEvent(ev)" class="mx-2 px-4 py-3.5 text-[10px] font-black text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer rounded-xl transition-all uppercase group relative overflow-hidden">
                         <span class="relative z-10">{{ ev }}</span>
                         <div class="absolute inset-y-0 left-0 w-1 bg-blue-600 -translate-x-full group-hover:translate-x-0 transition-transform"></div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- 3. Usuario Responsable -->
            <div class="flex flex-col gap-2 flex-[1.5] min-w-0 relative">
              <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Usuario Responsable</span>
              <div 
                (click)="toggleDropdown('user', $event)"
                class="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-2.5 text-[10px] font-black text-slate-700 cursor-pointer flex justify-between items-center hover:bg-white hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/5 shadow-sm transition-all min-h-[44px] group antialiased tracking-tight"
              >
                <span class="truncate">{{ selectedUserLabel }}</span>
                <svg class="h-4 w-4 text-slate-300 transition-transform group-hover:text-blue-500" [class.rotate-180]="activeDropdown() === 'user'" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
              @if (activeDropdown() === 'user') {
                <div class="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-[24px] mt-3 shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[60] animate-in slide-in-from-top-3 overflow-hidden flex flex-col max-h-[380px] ring-1 ring-slate-900/5">
                  <div class="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div class="relative group">
                      <input type="text" [(ngModel)]="userSearch" (click)="$event.stopPropagation()" placeholder="Buscar..." class="w-full bg-white border border-slate-200 rounded-2xl px-11 py-2.5 text-[11px] font-black outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm">
                      <svg class="h-4 w-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke-width="2.5"/></svg>
                    </div>
                  </div>
                  <div class="overflow-y-auto custom-scrollbar flex-1 py-2">
                    <div (click)="selectUser(null)" class="mx-2 px-4 py-3 text-[10px] hover:bg-slate-50 cursor-pointer font-black text-slate-400 uppercase tracking-widest rounded-xl transition-colors">Todos los Usuarios</div>
                    @for (user of filteredUsers(); track user.id) {
                      <div (click)="selectUser(user)" class="mx-2 px-4 py-3.5 hover:bg-blue-50 cursor-pointer transition-all rounded-xl group relative overflow-hidden">
                        <div class="relative z-10">
                          <div class="text-[10px] font-black text-slate-800 group-hover:text-blue-700">{{ user.name }}</div>
                          <div class="text-[9px] text-slate-400 font-bold mt-0.5">{{ user.email }}</div>
                        </div>
                        <div class="absolute inset-y-0 left-0 w-1 bg-blue-600 -translate-x-full group-hover:translate-x-0 transition-transform"></div>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- 4. Periodo -->
            <div class="flex flex-col gap-2 flex-1 min-w-0 relative">
              <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Periodo Temporal</span>
              <div 
                (click)="toggleDropdown('period', $event)"
                class="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-2.5 text-[10px] font-black text-slate-700 cursor-pointer flex justify-between items-center hover:bg-white hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/5 shadow-sm transition-all min-h-[44px] group antialiased tracking-tight"
              >
                <span class="truncate">{{ selectedPeriodLabel }}</span>
                <svg class="h-4 w-4 text-slate-300 transition-transform group-hover:text-blue-500" [class.rotate-180]="activeDropdown() === 'period'" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
              @if (activeDropdown() === 'period') {
                <div class="absolute top-full left-0 right-0 bg-white border border-slate-200 rounded-[24px] mt-3 shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-[60] animate-in slide-in-from-top-3 overflow-hidden py-2 ring-1 ring-slate-900/5">
                  @for (p of periods; track p.id) {
                    <div (click)="selectPeriod(p.id)" class="mx-2 px-4 py-3.5 hover:bg-blue-50 cursor-pointer transition-all rounded-xl group relative overflow-hidden">
                       <span class="relative z-10 text-[10px] font-black text-slate-700 group-hover:text-blue-700">{{ p.label }}</span>
                       <div class="absolute inset-y-0 left-0 w-1 bg-blue-600 -translate-x-full group-hover:translate-x-0 transition-transform"></div>
                    </div>
                  }
                </div>
              }
            </div>

            @if (filters.period === 'custom') {
              <div class="flex items-center gap-4 animate-in slide-in-from-left-4 duration-500 flex-[2]">
                <div class="flex flex-col gap-1.5 flex-1">
                  <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha Inicio</span>
                  <input type="datetime-local" [(ngModel)]="filters.date_start" (change)="onFilterChange()" class="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm w-full antialiased tracking-tight tabular-nums">
                </div>
                <div class="flex flex-col gap-1.5 flex-1">
                  <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha Fin</span>
                  <input type="datetime-local" [(ngModel)]="filters.date_end" (change)="onFilterChange()" class="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-[10px] font-black text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm w-full antialiased tracking-tight tabular-nums">
                </div>
              </div>
            }
        </div>
      }

      <!-- Gráfico Compacto Premium -->
      @if (showChart()) {
        <div class="bg-white px-8 py-3 shrink-0 border-b border-slate-200/50 animate-in slide-in-from-top-2 duration-300">
          <div class="h-16 flex items-end gap-[3px] px-3 relative bg-slate-50/30 rounded-2xl border border-slate-100 py-1.5 shadow-inner">
            @if (isStatsLoading()) {
              <div class="absolute inset-0 bg-white/40 flex items-center justify-center z-10 rounded-2xl backdrop-blur-[1px]">
                <div class="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            }

            @for (stat of chartStats(); track stat.label) {
              <div 
                class="flex-1 bg-blue-600/90 hover:bg-blue-500 transition-all rounded-t-lg group relative"
                [style.height.%]="getBarHeight(stat.total)"
              >
                <div class="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] px-3 py-1.5 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-[70] transition-all scale-90 group-hover:scale-100 border border-slate-700 font-black">
                  <span class="text-blue-400 mr-2 uppercase tracking-tighter">{{ stat.label }}</span>
                  <span>{{ stat.total }} Eventos</span>
                </div>
              </div>
            }
          </div>
          <div class="flex justify-between text-[7px] text-slate-400 font-black uppercase tracking-[0.2em] px-4 py-2">
            @for (label of chartLabels(); track label) {
              <span>{{ label }}</span>
            }
          </div>
        </div>
      }

      <!-- Tabla Principal -->
      <div class="flex-1 min-h-0 overflow-hidden flex flex-col relative bg-white">
        @if (isLoading()) {
          <div class="absolute inset-0 bg-white/60 backdrop-blur-md z-40 flex items-center justify-center">
            <div class="flex flex-col items-center gap-4">
               <div class="w-12 h-12 border-[5px] border-blue-600 border-t-transparent rounded-full animate-spin shadow-[0_0_30px_rgba(37,99,235,0.2)]"></div>
               <span class="text-[11px] font-black text-blue-600 uppercase tracking-[0.4em]">Sincronizando Auditoría</span>
            </div>
          </div>
        }

        <div class="flex-1 overflow-auto custom-scrollbar relative min-h-0">
          <table class="w-full text-left text-xs border-separate border-spacing-0 min-w-[1000px]">
            <thead class="sticky top-0 z-20">
              <tr class="bg-slate-500 text-white shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
                <th class="px-6 py-2 font-black uppercase tracking-widest text-[8px] border-r border-white/5 w-24">Nivel</th>
                <th class="px-6 py-2 font-black uppercase tracking-widest text-[8px] border-r border-white/5 w-36">Fecha</th>
                <th class="px-6 py-2 font-black uppercase tracking-widest text-[8px] border-r border-white/5 w-40">Usuario</th>
                <th class="px-6 py-2 font-black uppercase tracking-widest text-[8px]">Detalle de Operación / Contexto de Sistema</th>
                <th class="px-6 py-2 w-12"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (log of (logsData()?.data || []); track log.id) {
                <tr (click)="toggleLog(log.id)" class="hover:bg-slate-50/80 cursor-pointer transition-all group border-l-[6px] border-transparent hover:border-blue-600 active:bg-blue-50">
                  <td class="px-6 py-1.5">
                    <span [class]="getSeverityClass(log.type)" class="scale-90 origin-left">
                      {{ log.type }}
                    </span>
                  </td>
                  <td class="px-6 py-1.5 text-slate-500 font-bold text-[9px] whitespace-nowrap">
                    {{ log.date | date:'dd/MM HH:mm':'UTC':'es-CL' }}
                  </td>
                  <td class="px-6 py-1.5 whitespace-nowrap">
                    <div class="flex items-center gap-2">
                       <div class="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-black shrink-0" [class]="log.user_id === 0 ? 'bg-slate-900 text-white' : 'bg-blue-50 text-blue-600 border border-blue-100'">
                          {{ log.user_id === 0 ? 'S' : (getUserName(log.user_id).substring(0, 1).toUpperCase()) }}
                       </div>
                       <div class="flex flex-col">
                          <span class="text-[10px] font-black leading-none truncate max-w-[120px]" [class]="log.user_id === 0 ? 'text-slate-900' : 'text-slate-700'">
                            {{ log.user_id === 0 ? 'SISTEMA' : getUserName(log.user_id) }}
                          </span>
                       </div>
                    </div>
                  </td>
                  <td class="px-6 py-1.5">
                    <div class="flex flex-col gap-0.5">
                      <span class="truncate font-bold text-slate-800 max-w-4xl leading-tight text-[11px] tracking-tight">{{ log.long_text }}</span>
                      <div class="flex items-center gap-2">
                         <span class="text-[8px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">{{ log.event }}</span>
                         <span class="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">&bull; {{ log.operation }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-1.5 text-right">
                    <div class="w-6 h-6 rounded-full flex items-center justify-center transition-all group-hover:bg-blue-100/50">
                      <svg [class.rotate-180]="expandedLogId() === log.id" class="h-4 w-4 text-slate-300 group-hover:text-blue-600 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </div>
                  </td>
                </tr>
                @if (expandedLogId() === log.id) {
                  <tr class="bg-slate-50/50">
                    <td colspan="5" class="p-0 border-b border-slate-200 shadow-inner overflow-hidden">
                      <div class="px-12 py-10 border-l-[12px] border-blue-600 grid grid-cols-1 lg:grid-cols-12 gap-10 animate-in fade-in slide-in-from-top-4 duration-500 bg-white">
                         <div class="lg:col-span-5 space-y-8">
                            <div class="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
                              <h5 class="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-4"><span class="w-6 h-px bg-slate-200"></span>Rastreo de Identidad</h5>
                              <div class="flex justify-between items-center text-[12px] py-3 border-b border-slate-50">
                                <span class="text-slate-400 font-bold uppercase tracking-tighter">Operador</span>
                                <span class="font-black px-5 py-1.5 rounded-2xl text-[11px] flex items-center gap-2" [class]="log.user_id === 0 ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-slate-100 text-slate-900'">
                                  @if (log.user_id === 0) {
                                    <svg class="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/></svg>
                                  }
                                  {{ log.user_id === 0 ? 'SISTEMA CENTRAL' : getUserName(log.user_id) }}
                                  <span class="text-blue-500 ml-2">#{{ log.user_id }}</span>
                                </span>
                              </div>
                              <div class="flex flex-col gap-3 pt-2">
                                <span class="text-[10px] text-slate-400 font-black uppercase tracking-widest">Ruta del Recurso (URI)</span>
                                <span class="text-[11px] font-mono text-slate-500 break-all bg-slate-50 p-5 rounded-3xl border border-slate-100 leading-relaxed shadow-inner">{{ log.uri }}</span>
                              </div>
                            </div>
                            @if (log.type_exception) {
                              <div class="bg-red-50 p-8 rounded-[32px] border border-red-100 shadow-sm space-y-5">
                                <h5 class="text-[11px] font-black text-red-500 uppercase tracking-[0.2em] flex items-center gap-4"><span class="w-6 h-px bg-red-200"></span>Excepción Crítica</h5>
                                <p class="text-[11px] font-black text-red-900 leading-tight bg-red-100/50 p-4 rounded-2xl break-all shadow-sm border border-red-200/50">{{ log.type_exception }}</p>
                                <div class="bg-white p-5 rounded-[24px] border border-red-100 shadow-inner">
                                   <pre class="text-[10px] font-mono text-red-900 break-words whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed custom-scrollbar-red">{{ log.exception }}</pre>
                                </div>
                              </div>
                            }
                         </div>
                         <div class="lg:col-span-7 flex flex-col min-h-[450px]">
                            <h5 class="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-4"><span class="w-6 h-px bg-slate-200"></span>Volcado de Memoria / Payload JSON</h5>
                            <div class="flex-1 bg-[#0f172a] p-10 rounded-[40px] border border-slate-800 shadow-2xl relative group overflow-hidden">
                               <pre class="text-[12px] font-mono text-blue-400 overflow-auto h-full custom-scrollbar-dark leading-relaxed">{{ log.evidence | json }}</pre>
                               <button (click)="$event.stopPropagation(); copyEvidence(log.evidence)" class="absolute top-6 right-6 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all border border-blue-400/30 shadow-2xl flex items-center gap-3 active:scale-90 ring-4 ring-blue-500/20 translate-y-2 group-hover:translate-y-0 cursor-pointer">
                                 <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" stroke-width="2.5"/></svg>
                                 <span class="text-[11px] font-black uppercase tracking-widest">Descargar JSON</span>
                               </button>
                               <div class="absolute bottom-[-30px] right-[-30px] opacity-[0.04] text-[120px] font-black pointer-events-none select-none text-white">&#123;&#125;</div>
                            </div>
                         </div>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- Footer / Paginación Premium Compacta -->
        <footer class="bg-slate-500 border-t border-white/10 px-8 py-3 flex justify-between items-center shrink-0 z-30 shadow-[0_-15px_40px_rgba(0,0,0,0.15)]">
          <div class="flex items-center gap-8 text-white">
             <div class="flex items-center gap-4">
                <span class="text-[9px] font-black uppercase tracking-widest opacity-60">Visualizar</span>
                <div class="relative group">
                  <select [(ngModel)]="filters.per_page" (change)="onFilterChange()" class="bg-white/10 border border-white/20 text-white rounded-xl px-4 py-1.5 text-[10px] font-black outline-none cursor-pointer hover:bg-white/20 transition-all appearance-none pr-10 ring-white/10 focus:ring-4">
                    <option [ngValue]="10">10 REGISTROS</option>
                    <option [ngValue]="20">20 REGISTROS</option>
                    <option [ngValue]="50">50 REGISTROS</option>
                    <option [ngValue]="100">100 REGISTROS</option>
                  </select>
                  <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-hover:opacity-100 transition-opacity">
                    <svg class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke-width="3" stroke-linecap="round"/></svg>
                  </div>
                </div>
             </div>
             <div class="h-6 w-px bg-white/10"></div>
             <span class="text-[10px] font-black uppercase tracking-[0.3em] opacity-80 drop-shadow-md">PÁGINA {{ logsData()?.current_page }} DE {{ logsData()?.last_page }}</span>
          </div>

          <div class="flex gap-4">
            <button 
              [disabled]="logsData()?.current_page === 1 || isLoading()" 
              (click)="changePage(logsData()!.current_page - 1)" 
              class="px-6 py-2 bg-white/5 hover:bg-white/15 text-white rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-5 disabled:cursor-not-allowed cursor-pointer active:scale-95 flex items-center gap-3 group"
            >
              <svg class="h-4 w-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke-width="3.5" stroke-linecap="round"/></svg>
              Anterior
            </button>
            <button 
              [disabled]="logsData()?.current_page === logsData()?.last_page || isLoading()" 
              (click)="changePage(logsData()!.current_page + 1)" 
              class="px-8 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl border border-blue-400/40 text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-950/30 disabled:opacity-5 disabled:cursor-not-allowed cursor-pointer active:scale-95 flex items-center gap-3 ring-4 ring-blue-500/10 group"
            >
              Siguiente
              <svg class="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke-width="3.5" stroke-linecap="round"/></svg>
            </button>
          </div>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; overflow: hidden; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
    
    .custom-scrollbar-dark::-webkit-scrollbar { width: 8px; }
    .custom-scrollbar-dark::-webkit-scrollbar-track { background: #0f172a; }
    .custom-scrollbar-dark::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; border: 2px solid #0f172a; }
    
    .custom-scrollbar-red::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar-red::-webkit-scrollbar-track { background: #fef2f2; }
    .custom-scrollbar-red::-webkit-scrollbar-thumb { background: #fecaca; border-radius: 10px; }

    @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slide-in-from-top-3 { from { transform: translateY(-16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes slide-in-from-left-4 { from { transform: translateX(-20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    .animate-in { animation: fade-in 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
  `]
})
export class LogsTiComponent implements OnInit {
  private loggerService = inject(LoggerService);

  logsData = signal<PaginatedLogs | null>(null);
  chartStats = signal<ChartStat[]>([]);
  userList = signal<LogUser[]>([]);

  expandedLogId = signal<number | null>(null);
  isLoading = signal<boolean>(false);
  isStatsLoading = signal<boolean>(false);
  showFilters = signal<boolean>(true);
  showChart = signal<boolean>(false);

  // Dropdown Management
  activeDropdown = signal<string | null>(null);
  userSearch = '';
  eventSearch = '';

  filters = {
    period: 'last_24h',
    type: '',
    event: '',
    user_id: null as number | null,
    date_start: this.getLastMonthDate(),
    date_end: this.getCurrentDate(),
    per_page: 10
  };

  severities = [
    { id: 'info', label: 'INFORMACIÓN' },
    { id: 'Warning', label: 'ADVERTENCIA' },
    { id: 'Error', label: 'ERROR CRÍTICO' },
    { id: 'Debug', label: 'DEPURACIÓN' }
  ];

  periods = [
    { id: 'last_5m', label: 'Últimos 5 Minutos' },
    { id: 'last_hour', label: 'Última Hora' },
    { id: 'last_24h', label: 'Últimas 24 Horas' },
    { id: 'last_7d', label: 'Últimos 7 Días' },
    { id: 'custom', label: 'Rango Personalizado' }
  ];

  eventTypes = [
    'USUARIO', 'SUSCRIPTOR', 'DOCUMENTOS', 'COMPROBANTE', 'VENTA', 'COMPRA',
    'REPORTE', 'AUXILIAR', 'PRODUCTO', 'TESORERIA', 'PARAMETROS', 'IMPORTACION',
    'EMPRESA', 'TIPO', 'SUBTIPO', 'CUENTA', 'SUBCUENTA', 'CUENTA MAESTRA',
    'PLAN DE CUENTA', 'BOLETA HONORARIO', 'CENTRO COSTO', 'HABER Y/O DESCUENTO',
    'CONFIGURACION NOMINA', 'ROL DE USUARIO', 'EMPLEADO', 'SUCURSAL',
    'ADUANA DIN', 'ADUANA CONTEXT', 'ADUANA MAESTRO', 'LIQUIDACION', 'SISTEMA'
  ];

  selectedSeverityLabel = 'TODOS LOS NIVELES';
  selectedEventLabel = 'CUALQUIER RECURSO';
  selectedUserLabel = 'TODOS LOS USUARIOS';
  selectedPeriodLabel = 'ÚLTIMAS 24 HORAS';

  filteredUsers = computed(() => {
    const search = this.userSearch.toLowerCase();
    const list = this.userList();
    if (!search) return list;
    return list.filter(u =>
      u.name.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search)
    );
  });

  filteredEvents = computed(() => {
    const search = this.eventSearch.toLowerCase();
    if (!search) return this.eventTypes;
    return this.eventTypes.filter(e => e.toLowerCase().includes(search));
  });

  chartLabels = computed(() => {
    const stats = this.chartStats();
    if (stats.length === 0) return [];
    const totalBars = stats.length;
    const step = Math.ceil(totalBars / 8);
    return stats
      .filter((_, i) => i % step === 0 || i === totalBars - 1)
      .map(s => s.label);
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    this.activeDropdown.set(null);
  }

  ngOnInit() {
    this.loadUsers();
    this.loadLogs();
  }

  private getLastMonthDate(): string {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().slice(0, 16);
  }

  private getCurrentDate(): string {
    return new Date().toISOString().slice(0, 16);
  }

  loadUsers() {
    this.loggerService.getUsers().subscribe(res => {
      // Filtrar usuarios: Solo Clientes (excluir Soporte #11)
      const filtered = res.data.filter(u => u.id !== 11);
      this.userList.set(filtered);
    });
  }

  onFilterChange() {
    this.loadLogs(1);
  }

  toggleDropdown(name: string, event: MouseEvent) {
    event.stopPropagation();
    this.activeDropdown.set(this.activeDropdown() === name ? null : name);
  }

  selectSeverity(id: string) {
    this.filters.type = id;
    this.selectedSeverityLabel = id ? this.severities.find(s => s.id === id)?.label || 'TODOS LOS NIVELES' : 'TODOS LOS NIVELES';
    this.activeDropdown.set(null);
    this.onFilterChange();
  }

  selectEvent(event: string) {
    this.filters.event = event;
    this.selectedEventLabel = event || 'CUALQUIER RECURSO';
    this.eventSearch = '';
    this.activeDropdown.set(null);
    this.onFilterChange();
  }

  selectUser(user: LogUser | null) {
    this.filters.user_id = user ? user.id : null;
    this.selectedUserLabel = user ? user.name : 'TODOS LOS USUARIOS';
    this.userSearch = '';
    this.activeDropdown.set(null);
    this.onFilterChange();
  }

  selectPeriod(id: string) {
    this.filters.period = id;
    this.selectedPeriodLabel = this.periods.find(p => p.id === id)?.label || 'ÚLTIMA HORA';
    this.activeDropdown.set(null);
    this.onFilterChange();
  }

  loadLogs(page: number = 1) {
    this.isLoading.set(true);
    this.isStatsLoading.set(true);

    this.loggerService.getLogs(this.filters, page).subscribe({
      next: (res) => {
        // Filtrar logs de soporte (ID 11) en el frontend para asegurar consistencia
        if (res.data && res.data.data) {
          res.data.data = res.data.data.filter(log => log.user_id !== 11);
        }
        this.logsData.set(res.data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });

    this.loggerService.getStats(this.filters).subscribe({
      next: (res) => {
        this.chartStats.set(res.data);
        this.isStatsLoading.set(false);
      },
      error: () => this.isStatsLoading.set(false)
    });
  }

  getBarHeight(total: number): number {
    const stats = this.chartStats();
    if (stats.length === 0) return 0;
    const max = Math.max(...stats.map(s => s.total));
    if (total === 0) return 1;
    if (max === 0) return 1;
    return Math.max((total / max) * 100, 10);
  }

  changePage(page: number) {
    this.loadLogs(page);
  }

  toggleLog(id: number) {
    this.expandedLogId.set(this.expandedLogId() === id ? null : id);
  }

  getSeverityLabelClass(type: string): string {
    switch (type.toLowerCase()) {
      case 'error': return 'text-red-600';
      case 'warning': return 'text-amber-600';
      case 'info': return 'text-blue-600';
      case 'debug': return 'text-slate-500';
      default: return 'text-slate-700';
    }
  }

  getSeverityClass(type: string): string {
    const base = 'px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-sm';
    switch (type.toLowerCase()) {
      case 'error': return `${base} bg-red-50 text-red-600 border-red-100`;
      case 'warning': return `${base} bg-amber-50 text-amber-600 border-amber-100`;
      case 'info': return `${base} bg-blue-50 text-blue-600 border-blue-100`;
      case 'debug': return `${base} bg-slate-100 text-slate-600 border-slate-200`;
      default: return `${base} bg-white text-slate-500 border-slate-200`;
    }
  }

  getUserName(userId: number): string {
    if (userId === 0) return 'SISTEMA';
    const user = this.userList().find(u => u.id === userId);
    return user ? user.name : `Usuario #${userId}`;
  }

  copyEvidence(evidence: any) {
    navigator.clipboard.writeText(JSON.stringify(evidence, null, 2));
  }
}
