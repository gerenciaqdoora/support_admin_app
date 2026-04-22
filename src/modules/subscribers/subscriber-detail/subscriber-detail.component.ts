import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SubscriberService } from '@core/services/subscriber.service';
import { rxResource } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-subscriber-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="h-full flex flex-col bg-[#f8fafc] text-slate-800 overflow-hidden font-sans">
      
      @if (subscriberResource.isLoading()) {
        <div class="flex-1 flex flex-col items-center justify-center bg-white/60 backdrop-blur-md z-[100]">
           <div class="w-16 h-16 border-[6px] border-blue-600 border-t-transparent rounded-full animate-spin shadow-[0_0_40px_rgba(37,99,235,0.3)]"></div>
           <span class="text-[13px] font-black text-blue-600 uppercase tracking-[0.5em] mt-6 animate-pulse">Cargando Expediente</span>
        </div>
      }

      @if (subscriberResource.error()) {
        <div class="flex-1 flex flex-col items-center justify-center p-10 text-center">
           <div class="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-sm border border-red-100">⚠️</div>
           <h2 class="text-xl font-black text-slate-900 uppercase tracking-tighter">Error de Sincronización</h2>
           <p class="text-slate-400 mt-2 max-w-md">No se pudo recuperar el expediente del suscriptor. Verifique la conexión con el servidor de soporte.</p>
           <button routerLink="/subscribers" class="mt-8 px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95">Volver al Directorio</button>
        </div>
      }

      @if (data(); as subscriber) {
        <!-- Header de Detalle Premium -->
        <div class="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shrink-0 z-50 shadow-sm relative">
          <div class="flex items-center gap-5">
            <a routerLink="/subscribers" class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-100">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </a>
            <div>
              <div class="flex items-center gap-3">
                <h1 class="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">{{ subscriber.record?.usuario?.name || 'Cargando...' }}</h1>
                <span class="text-[10px] font-black px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-widest">ID #{{ subscriber.record?.id }}</span>
              </div>
              <div class="flex items-center gap-2 mt-2">
                 <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                 <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Expediente Detallado de Suscriptor</p>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button class="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-sm">
              Enviar Notificación
            </button>
            <button class="px-5 py-2.5 bg-red-50 border border-red-100 rounded-xl text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95 shadow-sm">
              Suspender Cuenta
            </button>
          </div>
        </div>

        <!-- Contenido Principal con Scroll -->
        <div class="flex-1 overflow-auto custom-scrollbar bg-slate-50/50">
          <div class="max-w-[1400px] mx-auto p-8 grid grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            <!-- Columna Izquierda: Perfil y Métricas -->
            <div class="col-span-12 lg:col-span-4 space-y-8">
              <!-- Card de Perfil -->
              <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="h-24 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
                  <div class="absolute -bottom-12 left-8 p-1.5 bg-white rounded-[2rem] shadow-xl">
                    <div class="w-24 h-24 rounded-[1.7rem] bg-slate-900 text-white flex items-center justify-center text-4xl font-black shadow-inner uppercase">
                      {{ subscriber.record?.usuario?.name?.charAt(0) || '?' }}
                    </div>
                  </div>
                </div>
                <div class="pt-16 pb-8 px-8">
                  <h2 class="text-2xl font-black text-slate-900 tracking-tighter uppercase">{{ subscriber.record?.usuario?.name }}</h2>
                  <p class="text-sm text-slate-400 font-medium mb-6 lowercase">{{ subscriber.record?.usuario?.email }}</p>
                  
                  <div class="flex flex-wrap gap-2">
                    @if (subscriber.record?.es_demo) {
                      <span class="px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest border border-amber-100">Trial / Demo</span>
                    } @else {
                      <span class="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-100">Cuenta Activa</span>
                    }
                    <span class="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest border border-blue-100">
                      Plan {{ subscriber.metrics?.plan_name }}
                    </span>
                  </div>
                </div>
                <div class="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/50">
                  <div class="p-6 text-center">
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Miembro Desde</p>
                    <p class="text-xs font-black text-slate-800">{{ subscriber.record?.date_subscribed | date:'dd MMM, yyyy':'':'es-CL' }}</p>
                  </div>
                  <div class="p-6 text-center">
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Vencimiento</p>
                    <p class="text-xs font-black text-slate-800">{{ subscriber.record?.subscription_valid_to | date:'dd MMM, yyyy':'':'es-CL' }}</p>
                  </div>
                </div>
              </div>

              <!-- Métricas de Uso Forense -->
              <div class="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <h3 class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3">
                  <span class="w-1.5 h-4 bg-blue-600 rounded-full"></span>
                  Métricas de Consumo
                </h3>
                <div class="space-y-6">
                  <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
                    <div class="flex justify-between items-center">
                      <div class="flex flex-col">
                        <span class="text-[10px] font-black text-slate-400 uppercase tracking-tight">Empresas Creadas</span>
                        <span class="text-2xl font-black text-slate-900 mt-1">{{ subscriber.metrics?.total_companies || 0 }}</span>
                      </div>
                      <div class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl">🏢</div>
                    </div>
                  </div>
                  <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all">
                    <div class="flex justify-between items-center">
                      <div class="flex flex-col">
                        <span class="text-[10px] font-black text-slate-400 uppercase tracking-tight">Usuarios en Equipo</span>
                        <span class="text-2xl font-black text-slate-900 mt-1">{{ subscriber.metrics?.total_users || 0 }}</span>
                      </div>
                      <div class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl">👥</div>
                    </div>
                  </div>
                  <div class="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 group hover:border-blue-400 transition-all">
                    <div class="flex justify-between items-center">
                      <div class="flex flex-col">
                        <span class="text-[10px] font-black text-blue-400 uppercase tracking-tight">Total Movimientos</span>
                        <span class="text-2xl font-black text-blue-600 mt-1">{{ subscriber.metrics?.total_movements || 0 }}</span>
                      </div>
                      <div class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl text-blue-600 font-black">Σ</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Columna Derecha: Listados Detallados -->
            <div class="col-span-12 lg:col-span-8 space-y-8">
              
              <!-- Listado de Empresas -->
              <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="px-8 py-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                  <h3 class="text-xs font-black text-slate-900 uppercase tracking-widest">Empresas Asociadas</h3>
                  <span class="px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-[10px] font-black text-slate-500">{{ subscriber.record?.empresas?.length || 0 }} Entidades</span>
                </div>
                <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  @for (company of subscriber.record?.empresas; track company.id) {
                    <div class="p-4 rounded-2xl border border-slate-100 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/5 transition-all group flex items-center gap-4 bg-white">
                      <div class="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center text-lg group-hover:bg-blue-600 group-hover:text-white transition-all uppercase">
                        {{ company.social_reason?.charAt(0) || 'E' }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-xs font-black text-slate-800 uppercase truncate">{{ company.social_reason }}</p>
                        <p class="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5">RUT: {{ company.rut }}</p>
                        <div class="flex items-center gap-2 mt-2">
                          <span class="text-[9px] font-black text-blue-600 px-1.5 py-0.5 bg-blue-50 rounded">{{ company.vouchers_count || 0 }} Vouchers</span>
                          <span class="text-[9px] font-bold text-slate-400">ID: #{{ company.id }}</span>
                        </div>
                      </div>
                    </div>
                  } @empty {
                    <div class="col-span-full py-12 text-center opacity-30 italic text-xs font-bold">No hay empresas asociadas a este suscriptor.</div>
                  }
                </div>
              </div>

              <!-- Tabla de Usuarios de Equipo -->
              <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="px-8 py-5 bg-slate-50 border-b border-slate-200">
                  <h3 class="text-xs font-black text-slate-900 uppercase tracking-widest">Personal del Suscriptor</h3>
                </div>
                <table class="w-full text-left border-separate border-spacing-0">
                  <thead>
                    <tr class="bg-slate-800 text-white">
                      <th class="px-8 py-3 text-[9px] font-black uppercase tracking-widest border-r border-white/5">Usuario</th>
                      <th class="px-8 py-3 text-[9px] font-black uppercase tracking-widest text-right">Email / Contacto</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (member of (subscriber.record?.team_users || subscriber.record?.teamUsers); track member.id) {
                      <tr class="hover:bg-blue-50/30 transition-all group">
                        <td class="px-8 py-4">
                          <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all uppercase">
                              {{ member.user?.name?.charAt(0) || 'U' }}
                            </div>
                            <span class="text-xs font-black text-slate-800 uppercase tracking-tight">{{ member.user?.name }}</span>
                          </div>
                        </td>
                        <td class="px-8 py-4 text-right">
                          <span class="text-[10px] text-slate-500 font-bold tracking-tight lowercase">{{ member.user?.email }}</span>
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td colspan="2" class="py-12 text-center opacity-30 italic text-xs font-bold">No hay personal asociado a este suscriptor.</td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Historial de Pagos Recientes -->
              <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="px-8 py-5 bg-slate-50 border-b border-slate-200">
                  <h3 class="text-xs font-black text-slate-900 uppercase tracking-widest">Historial de Facturación</h3>
                </div>
                <div class="p-4">
                  <table class="w-full text-left">
                    <thead>
                      <tr class="text-slate-400">
                        <th class="px-4 py-2 text-[9px] font-black uppercase tracking-widest">Fecha</th>
                        <th class="px-4 py-2 text-[9px] font-black uppercase tracking-widest">Referencia</th>
                        <th class="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-right">Monto Total</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      @for (pago of subscriber.record?.pagos; track pago.id) {
                        <tr class="hover:bg-slate-50 transition-colors">
                          <td class="px-4 py-4">
                            <span class="text-[10px] font-bold text-slate-600">{{ pago.created_at | date:'dd/MM/yyyy HH:mm' }}</span>
                          </td>
                          <td class="px-4 py-4">
                            <span class="text-[10px] font-black text-slate-400 uppercase tracking-tighter">REF: {{ pago.payu_confirmation_id || 'LOCAL_POS' }}</span>
                          </td>
                          <td class="px-4 py-4 text-right">
                            <span class="text-xs font-black text-slate-800">$ {{ (pago.total || 0) | number:'1.0-0' }}</span>
                          </td>
                        </tr>
                      } @empty {
                        <tr>
                          <td colspan="3" class="py-12 text-center opacity-20 italic text-xs font-bold">No se registran pagos recientes.</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
      }
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
export class SubscriberDetailComponent {
  private _route = inject(ActivatedRoute);
  private _subscriberService = inject(SubscriberService);

  // Usamos rxResource para una gestión de datos más reactiva y robusta (Angular 21)
  subscriberResource = rxResource({
    params: () => Number(this._route.snapshot.params['id']),
    stream: ({ params: id }) => this._subscriberService.getSubscriberById(id)
  });

  data = computed(() => {
    const res = this.subscriberResource.value();
    return res?.data || null;
  });
}
