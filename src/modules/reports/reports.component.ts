import { Component, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '@core/services/analytics.service';
import { NgApexchartsModule, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="space-y-8 pb-20">
      <div>
        <h1 class="text-2xl font-black text-slate-800">Reportes y Analítica</h1>
        <p class="text-sm text-slate-400 mt-1">Rendimiento del equipo de soporte y métricas de servicio (SLA).</p>
      </div>

      @if (analyticsService.isLoading()) {
        <div class="p-20 flex flex-col items-center justify-center opacity-40">
           <div class="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
           <p>Calculando métricas...</p>
        </div>
      } @else if (data()) {
        <!-- SLA Metrics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="glass-card p-6 rounded-3xl bg-white hover-scale border border-transparent hover:border-accent/10">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Primera Respuesta Promedio</p>
            <div class="flex items-end gap-2">
              <span class="text-4xl font-black text-slate-800">{{ data()!.sla_metrics.avg_first_response_hours }}</span>
              <span class="text-sm font-bold text-slate-400 mb-1">Horas</span>
            </div>
            <p class="text-xs text-green-500 font-medium mt-2 flex items-center gap-1">
               <span class="text-base">↓</span> Dentro del SLA
            </p>
          </div>
          
          <div class="glass-card p-6 rounded-3xl bg-white hover-scale border border-transparent hover:border-accent/10">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Resolución Promedio</p>
            <div class="flex items-end gap-2">
              <span class="text-4xl font-black text-slate-800">{{ data()!.sla_metrics.avg_resolution_hours }}</span>
              <span class="text-sm font-bold text-slate-400 mb-1">Horas</span>
            </div>
          </div>
          
          <div class="glass-card p-6 rounded-3xl bg-white hover-scale border border-transparent hover:border-red-500/30">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tickets Atrasados (SLA Incumplido)</p>
            <div class="flex items-end gap-2">
              <span class="text-4xl font-black text-red-500">{{ data()!.sla_metrics.total_open_overdue }}</span>
              <span class="text-sm font-bold text-slate-400 mb-1">Tickets</span>
            </div>
            <p class="text-xs text-red-400 font-medium mt-2">
               Requieren atención inmediata
            </p>
          </div>
        </div>

        <!-- Charts Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          <!-- Volume Over Time (Area Chart) -->
          <div class="glass-card bg-white rounded-3xl p-6 shadow-sm lg:col-span-2">
            <h3 class="text-lg font-bold text-slate-800 mb-4 px-2">Volumen de Tickets (Últimos 30 días)</h3>
            <apx-chart
              [series]="volumeChartOptions.series"
              [chart]="volumeChartOptions.chart"
              [xaxis]="volumeChartOptions.xaxis"
              [dataLabels]="volumeChartOptions.dataLabels"
              [stroke]="volumeChartOptions.stroke"
              [colors]="volumeChartOptions.colors"
              [fill]="volumeChartOptions.fill"
              [tooltip]="volumeChartOptions.tooltip"
            ></apx-chart>
          </div>

          <!-- Status Distribution (Donut Chart) -->
          <div class="glass-card bg-white rounded-3xl p-6 shadow-sm flex flex-col">
            <h3 class="text-lg font-bold text-slate-800 mb-4 px-2">Distribución por Estado</h3>
            <div class="flex-1 flex items-center justify-center">
              <apx-chart
                [series]="statusChartOptions.series"
                [chart]="statusChartOptions.chart"
                [labels]="statusChartOptions.labels"
                [colors]="statusChartOptions.colors"
                [legend]="statusChartOptions.legend"
              ></apx-chart>
            </div>
          </div>

          <!-- Priority Distribution (Bar Chart) -->
          <div class="glass-card bg-white rounded-3xl p-6 shadow-sm flex flex-col">
            <h3 class="text-lg font-bold text-slate-800 mb-4 px-2">Tickets por Prioridad</h3>
            <div class="flex-1 flex items-center justify-center w-full">
               <apx-chart class="w-full"
                [series]="priorityChartOptions.series"
                [chart]="priorityChartOptions.chart"
                [xaxis]="priorityChartOptions.xaxis"
                [colors]="priorityChartOptions.colors"
                [plotOptions]="priorityChartOptions.plotOptions"
                [dataLabels]="priorityChartOptions.dataLabels"
              ></apx-chart>
            </div>
          </div>

        </div>
      }
    </div>
  `
})
export class ReportsComponent implements OnInit {
  analyticsService = inject(AnalyticsService);

  // Signal derivado para facilitar el acceso en el template y las configuraciones de los gráficos
  data = computed(() => this.analyticsService.dashboardData());

  // Configuraciones de ApexCharts
  volumeChartOptions: any = {};
  statusChartOptions: any = {};
  priorityChartOptions: any = {};

  constructor() {
    // Configurar opciones básicas inicialmente
    this.initChartOptions();
  }

  ngOnInit() {
    this.analyticsService.getDashboardData().subscribe(() => {
      this.updateChartData();
    });
  }

  private initChartOptions() {
    this.volumeChartOptions = {
      series: [{ name: "Tickets Creados", data: [] }],
      chart: { type: "area", height: 350, toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
      colors: ["#3b82f6"],
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 3 },
      fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 100] } },
      xaxis: { type: "datetime", categories: [], labels: { style: { colors: '#94a3b8' } } },
      tooltip: { theme: 'light' }
    };

    this.statusChartOptions = {
      series: [],
      chart: { type: "donut", height: 320, fontFamily: 'Inter, sans-serif' },
      labels: [],
      colors: ["#f59e0b", "#3b82f6", "#10b981", "#64748b"], // Open, In Progress, Resolved, Closed
      legend: { position: "bottom", horizontalAlign: "center", labels: { colors: '#475569' } }
    };

    this.priorityChartOptions = {
      series: [{ name: "Tickets", data: [] }],
      chart: { type: "bar", height: 320, toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
      colors: ["#ef4444"], // Default color, will be mapped per bar later if needed
      plotOptions: { bar: { borderRadius: 6, horizontal: false, columnWidth: '45%' } },
      dataLabels: { enabled: false },
      xaxis: { categories: [], labels: { style: { colors: '#94a3b8', fontWeight: 600 } } }
    };
  }

  private updateChartData() {
    const dashboard = this.data();
    if (!dashboard) return;

    // Volumen
    this.volumeChartOptions.series = [{ name: "Tickets Creados", data: dashboard.volume_over_time.series }];
    this.volumeChartOptions.xaxis = { ...this.volumeChartOptions.xaxis, categories: dashboard.volume_over_time.labels };

    // Estados
    const statuses = Object.keys(dashboard.status_distribution);
    const statusCounts = Object.values(dashboard.status_distribution);
    this.statusChartOptions.labels = statuses;
    this.statusChartOptions.series = statusCounts;

    // Prioridades
    const priorities = Object.keys(dashboard.priority_distribution);
    const priorityCounts = Object.values(dashboard.priority_distribution);
    this.priorityChartOptions.xaxis = { ...this.priorityChartOptions.xaxis, categories: priorities };
    this.priorityChartOptions.series = [{ name: "Tickets", data: priorityCounts }];
  }
}
