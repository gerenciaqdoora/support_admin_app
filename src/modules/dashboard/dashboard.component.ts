import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketService } from '@core/services/ticket.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Stats Cards -->
        <div class="glass-card p-6 rounded-2xl hover-scale bg-white">
          <p class="text-slate-500 text-sm font-medium">Tickets Abiertos</p>
          <p class="text-3xl font-bold mt-2 text-primary">12</p>
        </div>
        <div class="glass-card p-6 rounded-2xl hover-scale bg-white">
          <p class="text-slate-500 text-sm font-medium">En Progreso</p>
          <p class="text-3xl font-bold mt-2 text-blue-500">5</p>
        </div>
        <div class="glass-card p-6 rounded-2xl hover-scale bg-white">
          <p class="text-slate-500 text-sm font-medium">SLA Promedio</p>
          <p class="text-3xl font-bold mt-2 text-green-500">2.4h</p>
        </div>
        <div class="glass-card p-6 rounded-2xl hover-scale bg-white">
          <p class="text-slate-500 text-sm font-medium">Satisfacción</p>
          <p class="text-3xl font-bold mt-2 text-yellow-500">4.8★</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="glass-card p-8 rounded-2xl bg-white min-h-[300px]">
          <h3 class="text-lg font-bold mb-6">Actividad Reciente</h3>
          <div class="space-y-4">
             <div class="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors">
                <div class="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                <div>
                   <p class="text-sm font-medium text-slate-800">Nuevo ticket creado: Error en Facturación</p>
                   <p class="text-xs text-slate-400">Hace 5 minutos · Empresa ABC</p>
                </div>
             </div>
          </div>
        </div>
        
        <div class="glass-card p-8 rounded-2xl bg-white min-h-[300px]">
          <h3 class="text-lg font-bold mb-6">Métricas de Resolución</h3>
          <div class="flex items-center justify-center h-48 text-slate-300 italic">
            Gráfico de barras aquí (Próximamente)
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  ticketService = inject(TicketService);

  ngOnInit() {
    this.ticketService.getTickets().subscribe();
  }
}
