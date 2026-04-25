import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketService } from '@core/services/ticket.service';
import { TicketStatus, TicketPriority } from '@core/models/support.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-full overflow-y-auto p-8 space-y-8 animate-in fade-in zoom-in duration-700 custom-scrollbar">
      
      <!-- HEADER METRICS (HIGH DENSITY) -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🔥</div>
            <span class="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase tracking-widest">Active</span>
          </div>
          <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest">Tickets Abiertos</p>
          <p class="text-4xl font-black mt-2 text-slate-900 tracking-tighter">{{ stats().open }}</p>
        </div>

        <div class="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">✅</div>
            <span class="text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-lg uppercase tracking-widest">Closed</span>
          </div>
          <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest">Resueltos Hoy</p>
          <p class="text-4xl font-black mt-2 text-slate-900 tracking-tighter">{{ stats().resolved }}</p>
        </div>

        <div class="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">⏳</div>
            <span class="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg uppercase tracking-widest">SLA</span>
          </div>
          <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest">SLA Promedio</p>
          <p class="text-4xl font-black mt-2 text-slate-900 tracking-tighter">2.4<span class="text-lg ml-1">h</span></p>
        </div>

        <div class="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🆘</div>
            <span class="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-lg uppercase tracking-widest">Critical</span>
          </div>
          <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest">Tickets Urgentes</p>
          <p class="text-4xl font-black mt-2 text-slate-900 tracking-tighter">{{ stats().urgent }}</p>
        </div>
      </div>

      <!-- MAIN CONTENT (2 COLUMNS) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- LEFT: DISTRIBUCIÓN Y LISTADO -->
        <div class="lg:col-span-2 space-y-8">
          
          <!-- CHART: TENDENCIA SEMANAL -->
          <div class="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <div class="flex items-center justify-between mb-10">
               <div>
                  <h3 class="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">Tendencia de Tickets</h3>
                  <p class="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Últimos 7 días</p>
               </div>
               <div class="flex gap-2">
                  <div class="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg">
                    <div class="w-2 h-2 rounded-full bg-blue-600"></div>
                    <span class="text-[9px] font-black text-blue-600 uppercase">Abiertos</span>
                  </div>
                  <div class="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg">
                    <div class="w-2 h-2 rounded-full bg-slate-400"></div>
                    <span class="text-[9px] font-black text-slate-400 uppercase">Cerrados</span>
                  </div>
               </div>
            </div>

            <!-- SIMULATED CHART (SVG) -->
            <div class="h-64 flex items-end justify-between gap-4 px-4">
              @for (day of trendData; track day.label) {
                <div class="flex-1 flex flex-col items-center gap-4 group">
                   <div class="relative w-full flex flex-col items-center justify-end h-48 gap-1">
                      <!-- Bar: Resolved -->
                      <div [style.height.%]="day.resolved" 
                           class="w-4 bg-slate-100 rounded-t-lg transition-all group-hover:bg-slate-200"></div>
                      <!-- Bar: Open -->
                      <div [style.height.%]="day.open" 
                           class="w-4 bg-blue-600 rounded-t-lg shadow-lg shadow-blue-100 transition-all group-hover:scale-y-110"></div>
                      
                      <!-- Tooltip -->
                      <div class="absolute -top-12 bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {{ day.open }} tickets
                      </div>
                   </div>
                   <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">{{ day.label }}</span>
                </div>
              }
            </div>
          </div>

          <!-- TABLE: TICKETS SIN RESOLVER POR GRUPO -->
          <div class="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 class="text-sm font-black text-slate-800 uppercase tracking-[0.2em] mb-8">Tickets Pendientes por Categoría</h3>
            <div class="space-y-1">
              @for (cat of categoryDistribution(); track cat.name) {
                <div class="flex items-center gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-all group">
                  <div class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                    {{ cat.icon }}
                  </div>
                  <div class="flex-1">
                    <p class="text-xs font-black text-slate-700 uppercase tracking-tight">{{ cat.name }}</p>
                    <div class="w-full h-1 bg-slate-50 rounded-full mt-2 overflow-hidden">
                      <div [style.width.%]="cat.percentage" class="h-full bg-blue-600 rounded-full"></div>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-black text-slate-900">{{ cat.count }}</p>
                    <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{{ cat.percentage }}%</p>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- RIGHT: SATISFACCIÓN Y ACTIVIDAD -->
        <div class="space-y-8">
          
          <!-- CARD: SATISFACCIÓN DEL CLIENTE -->
          <div class="bg-slate-900 p-10 rounded-[2.5rem] text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden">
            <div class="absolute top-0 right-0 p-8 opacity-10 text-6xl">🌟</div>
            <h3 class="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-8">NPS / Satisfacción</h3>
            <div class="text-center py-4">
              <p class="text-6xl font-black tracking-tighter">4.9</p>
              <div class="flex justify-center gap-1 mt-4">
                <span class="text-yellow-400">★</span><span class="text-yellow-400">★</span><span class="text-yellow-400">★</span><span class="text-yellow-400">★</span><span class="text-yellow-400">★</span>
              </div>
              <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-6 italic">Basado en 142 valoraciones</p>
            </div>

            <div class="grid grid-cols-3 gap-2 mt-10">
              <div class="bg-white/5 p-3 rounded-2xl text-center">
                <span class="text-xl">😊</span>
                <p class="text-[9px] font-black mt-2 text-green-400">92%</p>
              </div>
              <div class="bg-white/5 p-3 rounded-2xl text-center">
                <span class="text-xl">😐</span>
                <p class="text-[9px] font-black mt-2 text-slate-400">6%</p>
              </div>
              <div class="bg-white/5 p-3 rounded-2xl text-center">
                <span class="text-xl">😡</span>
                <p class="text-[9px] font-black mt-2 text-rose-400">2%</p>
              </div>
            </div>
          </div>

          <!-- CARD: ACTIVIDAD RECIENTE -->
          <div class="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h3 class="text-sm font-black text-slate-800 uppercase tracking-[0.2em] mb-8">Actividad de Agentes</h3>
            <div class="space-y-6">
              @for (act of recentActivity; track act.id) {
                <div class="flex items-start gap-4">
                  <div class="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                    <img [src]="'https://ui-avatars.com/api/?name=' + act.user" alt="U">
                  </div>
                  <div>
                    <p class="text-[11px] font-bold text-slate-800 leading-tight">
                      <span class="font-black">{{ act.user }}</span> {{ act.action }}
                    </p>
                    <p class="text-[10px] text-slate-400 mt-1 uppercase tracking-tighter">{{ act.time }}</p>
                  </div>
                </div>
              }
            </div>
            <button class="w-full mt-10 py-4 bg-slate-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 transition-all">
              Ver reporte completo
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  `]
})
export class DashboardComponent implements OnInit {
  ticketService = inject(TicketService);

  // Stats Dinámicas
  stats = computed(() => {
    const tickets = this.ticketService.tickets();
    return {
      open: tickets.filter(t => t.status === TicketStatus.OPEN).length,
      resolved: tickets.filter(t => t.status === TicketStatus.RESOLVED).length,
      urgent: tickets.filter(t => t.priority === TicketPriority.URGENT).length
    };
  });

  // Datos de Categoría (Simulados basados en tipos)
  categoryDistribution = computed(() => {
    const tickets = this.ticketService.tickets();
    const total = tickets.length || 1;
    
    const groups = [
      { name: 'Contabilidad (Asientos)', type: 'ACCOUNTING', icon: '📓' },
      { name: 'Facturación Electrónica', type: 'INVOICING', icon: '🧾' },
      { name: 'Remuneraciones (Nómina)', type: 'PAYROLL', icon: '💰' },
      { name: 'Aduanas & Logística', type: 'CUSTOMS', icon: '🚢' }
    ];

    return groups.map(g => {
      const count = tickets.filter(t => t.type === g.type).length;
      return {
        ...g,
        count,
        percentage: Math.round((count / total) * 100)
      };
    });
  });

  // Datos para el gráfico de barras (Simulados para el diseño)
  trendData = [
    { label: 'Lun', open: 12, resolved: 8 },
    { label: 'Mar', open: 45, resolved: 30 },
    { label: 'Mie', open: 60, resolved: 40 },
    { label: 'Jue', open: 35, resolved: 50 },
    { label: 'Vie', open: 80, resolved: 60 },
    { label: 'Sab', open: 20, resolved: 15 },
    { label: 'Dom', open: 10, resolved: 5 }
  ];

  recentActivity = [
    { id: 1, user: 'Franco Alvarado', action: 'resolvió el ticket #TK-120', time: 'hace 5 minutos' },
    { id: 2, user: 'Sistema QdoorA', action: 'escaló prioridad a Urgente en #TK-125', time: 'hace 12 minutos' },
    { id: 3, user: 'Agente Soporte', action: 'agregó una nota interna en #TK-118', time: 'hace 25 minutos' },
    { id: 4, user: 'Franco Alvarado', action: 'asignó #TK-121 a Soporte Nivel 2', time: 'hace 1 hora' }
  ];

  ngOnInit() {
    this.ticketService.getTickets().subscribe();
  }
}
