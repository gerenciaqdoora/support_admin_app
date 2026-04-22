import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SubscriberService } from '@core/services/subscriber.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-subscriber-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="h-full flex flex-col bg-[#f8fafc] text-slate-800 overflow-hidden font-sans">
      <!-- Header de Directorio Premium -->
      <div class="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shrink-0 z-50 shadow-sm relative">
        <div class="flex items-center gap-5">
          <div class="relative">
            <div class="w-1.5 h-12 bg-blue-600 rounded-full"></div>
            <div class="absolute inset-0 bg-blue-600 blur-lg opacity-20"></div>
          </div>
          <div>
            <h1 class="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">Directorio de Suscriptores</h1>
            <div class="flex items-center gap-2 mt-2">
               <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
               <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Gestión y Auditoría de Cuentas Activas</p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-6">
          <!-- Buscador Premium -->
          <div class="relative group min-w-[320px]">
            <input 
              type="text" 
              #s (input)="search(s.value)"
              placeholder="Buscar por nombre, email o ID..." 
              class="w-full bg-slate-50 border border-slate-100 rounded-2xl px-12 py-3 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-inner"
            >
            <svg class="h-5 w-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>

          <div class="flex items-center gap-8 border-l border-slate-100 pl-8">
            <div class="flex flex-col items-end">
               <span class="text-sm font-black text-slate-900 uppercase tracking-tighter">{{ subscriberService.subscribers().length }}</span>
               <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest opacity-60">Total Suscriptores</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Cuerpo de la Tabla -->
      <div class="flex-1 min-h-0 overflow-hidden flex flex-col relative bg-white">
        @if (subscriberService.isLoading()) {
          <div class="absolute inset-0 bg-white/60 backdrop-blur-md z-40 flex items-center justify-center">
            <div class="flex flex-col items-center gap-4">
               <div class="w-12 h-12 border-[5px] border-blue-600 border-t-transparent rounded-full animate-spin shadow-[0_0_30px_rgba(37,99,235,0.2)]"></div>
               <span class="text-[11px] font-black text-blue-600 uppercase tracking-[0.4em]">Sincronizando Directorio</span>
            </div>
          </div>
        }

        <div class="flex-1 overflow-auto custom-scrollbar relative min-h-0">
          <table class="w-full text-left text-xs border-separate border-spacing-0 min-w-[1000px]">
            <thead class="sticky top-0 z-20">
              <tr class="bg-slate-800 text-white shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
                <th class="px-6 py-3 font-black uppercase tracking-widest text-[9px] border-r border-white/5 w-16">ID</th>
                <th class="px-6 py-3 font-black uppercase tracking-widest text-[9px] border-r border-white/5">Suscriptor / Titular</th>
                <th class="px-6 py-3 font-black uppercase tracking-widest text-[9px] border-r border-white/5 w-32">Estado</th>
                <th class="px-6 py-3 font-black uppercase tracking-widest text-[9px] border-r border-white/5 w-40">Plan Actual</th>
                <th class="px-6 py-3 font-black uppercase tracking-widest text-[9px] border-r border-white/5 w-24 text-center">Empresas</th>
                <th class="px-6 py-3 font-black uppercase tracking-widest text-[9px] border-r border-white/5 w-24 text-center">Equipo</th>
                <th class="px-6 py-3 font-black uppercase tracking-widest text-[9px] w-40">Suscripción</th>
                <th class="px-6 py-3 w-12 bg-slate-800"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              @for (suscriptor of subscriberService.subscribers(); track suscriptor.id) {
                <tr [routerLink]="['/subscribers', suscriptor.id]" class="hover:bg-slate-50/80 cursor-pointer transition-all group border-l-[6px] border-transparent hover:border-blue-600 active:bg-blue-50">
                  <td class="px-6 py-4">
                    <span class="text-[10px] font-black text-slate-400">#{{ suscriptor.id }}</span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                        {{ suscriptor.usuario?.name?.charAt(0) }}
                      </div>
                      <div class="flex flex-col">
                        <span class="text-xs font-black text-slate-800 leading-tight uppercase tracking-tight">{{ suscriptor.usuario?.name }}</span>
                        <span class="text-[10px] text-slate-400 font-bold lowercase tracking-tight">{{ suscriptor.usuario?.email }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    @if (suscriptor.es_demo) {
                      <span class="px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[8px] font-black uppercase tracking-widest border border-amber-100 flex items-center gap-1.5 w-fit">
                        <span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Demo / Trial
                      </span>
                    } @else {
                      <span class="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase tracking-widest border border-emerald-100 flex items-center gap-1.5 w-fit">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Activo
                      </span>
                    }
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex flex-col">
                      <span class="text-[10px] font-black text-slate-700 uppercase tracking-tight">{{ suscriptor.latest_suscriptor_plan?.base_plan?.name || 'Standard' }}</span>
                      <span class="text-[8px] text-slate-400 font-bold uppercase mt-0.5">Renovación Mensual</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <span class="text-xs font-black text-slate-800">{{ suscriptor.empresas_count || 0 }}</span>
                  </td>
                  <td class="px-6 py-4 text-center">
                    <span class="text-xs font-black text-slate-800">{{ suscriptor.team_users_count || 0 }}</span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex flex-col">
                      <span class="text-[10px] font-bold text-slate-600">{{ suscriptor.date_subscribed | date:'dd MMM, yyyy':'':'es-CL' }}</span>
                      <span class="text-[8px] text-slate-400 font-black uppercase tracking-tighter mt-0.5">Vence: {{ suscriptor.subscription_valid_to | date:'dd/MM/yy' }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center transition-all group-hover:bg-blue-100/50">
                      <svg class="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </div>
                  </td>
                </tr>
              } @empty {
                @if (!subscriberService.isLoading()) {
                  <tr>
                    <td colspan="8" class="py-32 text-center">
                      <div class="flex flex-col items-center gap-4 opacity-20">
                         <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                         <p class="text-xl font-black uppercase tracking-widest">Sin Resultados</p>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Footer Premium con Estadísticas Rápidas -->
      <div class="bg-slate-900 px-8 py-3 shrink-0 flex justify-between items-center z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <div class="flex items-center gap-6">
          <div class="flex items-center gap-3">
             <div class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
             <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sincronización Activa</span>
          </div>
          <div class="w-px h-4 bg-slate-800"></div>
          <div class="text-[9px] font-black text-slate-500 uppercase tracking-widest">
            Última Actualización: {{ today | date:'HH:mm:ss' }}
          </div>
        </div>

        <div class="flex items-center gap-6">
          <div class="flex items-center gap-2 px-3 py-1.5 bg-slate-800 rounded-xl border border-slate-700/50">
             <span class="text-[10px] font-black text-white uppercase tracking-tighter">{{ subscriberService.subscribers().length }}</span>
             <span class="text-[8px] font-black text-slate-500 uppercase tracking-widest">Entidades</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; overflow: hidden; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
  `]
})
export class SubscriberListComponent implements OnInit {
  subscriberService = inject(SubscriberService);
  today = new Date();

  ngOnInit() {
    // Sincronización automática vía rxResource en el service
  }

  search(term: string) {
    this.subscriberService.searchQuery.set(term);
  }
}
