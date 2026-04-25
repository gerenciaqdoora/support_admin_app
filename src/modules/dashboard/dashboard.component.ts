import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketService } from '@core/services/ticket.service';
import { TicketStatus, TicketPriority } from '@core/models/support.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="h-full overflow-y-auto p-8 space-y-8 animate-in fade-in zoom-in duration-700 custom-scrollbar relative z-10">
      
      <!-- HEADER METRICS (HIGH DENSITY) -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-default">
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">🔥</div>
            <span class="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wider">Activos</span>
          </div>
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tickets Abiertos</p>
          <div class="flex items-baseline gap-2">
            <p class="text-3xl font-bold text-slate-900 tracking-tight">{{ stats().open }}</p>
            <span class="text-[10px] text-green-500 font-bold">+2 hoy</span>
          </div>
        </div>

        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-default">
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">✅</div>
            <span class="text-[9px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-md uppercase tracking-wider">Cerrados</span>
          </div>
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Resueltos Hoy</p>
          <p class="text-3xl font-bold text-slate-900 tracking-tight">{{ stats().resolved }}</p>
        </div>

        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-default">
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">⏳</div>
            <span class="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-md uppercase tracking-wider">SLA</span>
          </div>
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">SLA Promedio</p>
          <p class="text-3xl font-bold text-slate-900 tracking-tight">2.4<span class="text-lg ml-1 font-medium">h</span></p>
        </div>

        <div class="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group cursor-default">
          <div class="flex items-center justify-between mb-4">
            <div class="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">🆘</div>
            <span class="text-[9px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-md uppercase tracking-wider">Crítico</span>
          </div>
          <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tickets Urgentes</p>
          <p class="text-3xl font-bold text-slate-900 tracking-tight">{{ stats().urgent }}</p>
        </div>
      </div>

      <!-- MAIN CONTENT (2 COLUMNS) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- LEFT: DISTRIBUCIÓN Y LISTADO -->
        <div class="lg:col-span-2 space-y-8">
          
          <!-- CHART: TENDENCIA SEMANAL -->
          <div class="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <div class="flex items-center justify-between mb-8">
               <div>
                  <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest">Tendencia de Tickets</h3>
                  <p class="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Actividad de los últimos 7 días</p>
               </div>
               <div class="flex gap-2">
                  <div class="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-md border border-blue-100">
                    <div class="w-2 h-2 rounded-full bg-blue-600"></div>
                    <span class="text-[9px] font-black text-blue-600 uppercase tracking-tight">Abiertos</span>
                  </div>
                  <div class="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-md border border-slate-100">
                    <div class="w-2 h-2 rounded-full bg-slate-400"></div>
                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-tight">Cerrados</span>
                  </div>
               </div>
            </div>

            <!-- SIMULATED CHART -->
            <div class="h-64 flex items-end justify-between gap-6 px-4">
              @for (day of trendData; track day.label) {
                <div class="flex-1 flex flex-col items-center gap-3 group h-full justify-end">
                   <div class="relative w-full flex flex-col items-center justify-end h-full gap-1">
                      <!-- Bar: Resolved -->
                      <div [style.height.%]="day.resolved" 
                           class="w-full max-w-[12px] bg-slate-100 rounded-t-sm transition-all group-hover:bg-slate-200"></div>
                      <!-- Bar: Open -->
                      <div [style.height.%]="day.open" 
                           class="w-full max-w-[12px] bg-blue-600 rounded-t-sm shadow-[0_4px_12px_rgba(0,82,204,0.1)] transition-all group-hover:scale-y-105 origin-bottom"></div>
                      
                      <!-- Tooltip -->
                      <div class="absolute bottom-full mb-2 bg-slate-900 text-white text-[8px] font-bold px-2 py-1 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                        {{ day.open }} tickets
                      </div>
                   </div>
                   <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">{{ day.label }}</span>
                </div>
              }
            </div>
          </div>

          <!-- TABLE: TICKETS SIN RESOLVER POR GRUPO -->
          <div class="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <div class="flex items-center justify-between mb-8">
              <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest">Tickets Pendientes por Categoría</h3>
              <button class="text-[10px] font-black text-blue-600 hover:underline uppercase tracking-widest cursor-pointer">Ver Detalles</button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              @for (cat of categoryDistribution(); track cat.name) {
                <div class="flex items-center gap-4 p-4 border border-slate-50 hover:border-slate-200 hover:bg-slate-50/50 rounded-xl transition-all group">
                  <div class="w-10 h-10 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                    {{ cat.icon }}
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-[11px] font-black text-slate-700 uppercase tracking-tight truncate">{{ cat.name }}</p>
                    <div class="flex items-center gap-3 mt-2">
                      <div class="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div [style.width.%]="cat.percentage" class="h-full bg-blue-600 rounded-full"></div>
                      </div>
                      <span class="text-[10px] font-bold text-slate-500">{{ cat.percentage }}%</span>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-bold text-slate-900">{{ cat.count }}</p>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>

        <!-- RIGHT: SATISFACCIÓN Y ACTIVIDAD -->
        <div class="space-y-8">
          
          <!-- CARD: SATISFACCIÓN DEL CLIENTE PREMIUM -->
          <div class="bg-[#172B4D] p-8 rounded-xl text-white shadow-lg relative overflow-hidden group">
            <!-- Decorative patterns -->
            <div class="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all"></div>
            <div class="absolute -left-4 -bottom-4 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>

            <div class="relative z-10">
              <h3 class="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-8">Índice de Satisfacción (CSAT)</h3>
              <div class="flex flex-col items-center py-4">
                <div class="relative">
                  <p class="text-7xl font-bold tracking-tighter">4.9</p>
                  <div class="absolute -top-2 -right-4 bg-green-500 text-[8px] font-black px-1.5 py-0.5 rounded-sm">+0.2</div>
                </div>
                <div class="flex justify-center gap-1.5 mt-4">
                  @for (star of [1,2,3,4,5]; track star) {
                    <span class="text-yellow-400 text-lg">★</span>
                  }
                </div>
                <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-6 opacity-80">Basado en 142 encuestas este mes</p>
              </div>

              <div class="grid grid-cols-3 gap-3 mt-10">
                <div class="bg-white/10 backdrop-blur-sm p-3 rounded-lg text-center border border-white/5 hover:border-white/20 transition-all">
                  <span class="text-xl">😊</span>
                  <p class="text-[10px] font-bold mt-2 text-green-400">92%</p>
                </div>
                <div class="bg-white/10 backdrop-blur-sm p-3 rounded-lg text-center border border-white/5 hover:border-white/20 transition-all">
                  <span class="text-xl">😐</span>
                  <p class="text-[10px] font-bold mt-2 text-slate-400">6%</p>
                </div>
                <div class="bg-white/10 backdrop-blur-sm p-3 rounded-lg text-center border border-white/5 hover:border-white/20 transition-all">
                  <span class="text-xl">😡</span>
                  <p class="text-[10px] font-bold mt-2 text-rose-400">2%</p>
                </div>
              </div>
            </div>
          </div>

          <!-- CARD: ACTIVIDAD RECIENTE -->
          <div class="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <h3 class="text-xs font-black text-slate-800 uppercase tracking-widest mb-8">Actividad de Agentes</h3>
            <div class="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-slate-100">
              @for (act of recentActivity; track act.id) {
                <div class="flex items-start gap-4 relative z-10">
                  <div class="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center overflow-hidden shadow-sm flex-shrink-0 group-hover:border-blue-200 transition-all">
                    <img [src]="'https://ui-avatars.com/api/?background=f8fafc&color=172B4D&name=' + act.user" class="w-full h-full object-cover" alt="U">
                  </div>
                  <div class="min-w-0">
                    <p class="text-[11px] font-medium text-slate-700 leading-snug">
                      <span class="font-black text-slate-900">{{ act.user }}</span> {{ act.action }}
                    </p>
                    <div class="flex items-center gap-2 mt-1">
                      <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      <p class="text-[9px] text-slate-400 font-bold uppercase tracking-tight">{{ act.time }}</p>
                    </div>
                  </div>
                </div>
              }
            </div>
            <button class="w-full mt-10 py-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all cursor-pointer">
              Auditoría Completa
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
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
