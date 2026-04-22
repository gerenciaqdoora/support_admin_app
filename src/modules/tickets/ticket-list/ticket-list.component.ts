import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TicketService } from '@core/services/ticket.service';
import { TicketStatus } from '@core/models/support.models';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="flex h-full gap-8">
      <!-- Filtros Laterales -->
      <aside class="w-64 flex-shrink-0 space-y-2">
        <h3 class="px-4 text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Vistas</h3>
        <button (click)="filter('ALL')" [class.bg-white]="activeFilter() === 'ALL'" class="w-full text-left px-4 py-3 rounded-xl hover:bg-white/60 transition-all font-medium text-slate-600">
           Todos los Tickets
        </button>
        <button (click)="filter('OPEN')" [class.bg-white]="activeFilter() === 'OPEN'" class="w-full text-left px-4 py-3 rounded-xl hover:bg-white/60 transition-all font-medium text-slate-600 flex items-center justify-between">
           Abiertos
           <span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 text-xs">
             {{ openTicketsCount() }}
           </span>
        </button>
        <button (click)="filter('MINE')" [class.bg-white]="activeFilter() === 'MINE'" class="w-full text-left px-4 py-3 rounded-xl hover:bg-white/60 transition-all font-medium text-slate-600">
           Asignados a mí
        </button>
        <button (click)="filter('RESOLVED')" [class.bg-white]="activeFilter() === 'RESOLVED'" class="w-full text-left px-4 py-3 rounded-xl hover:bg-white/60 transition-all font-medium text-slate-600">
           Resueltos
        </button>
      </aside>

      <!-- Lista de Tickets -->
      <div class="flex-1 space-y-4">
        <div class="flex items-center justify-between mb-6">
           <div class="relative w-full max-w-md">
              <input type="text" (input)="searchQuery.set(t.value)" #t placeholder="Buscar por código o asunto..." class="w-full pl-10 pr-4 py-3 rounded-2xl border-none glass-card focus:ring-2 ring-accent outline-none text-sm shadow-sm">
              <span class="absolute left-4 top-3.5 opacity-40">🔍</span>
           </div>
           <button class="px-6 py-3 bg-accent text-white rounded-2xl font-bold shadow-lg hover:shadow-accent/30 hover:-translate-y-0.5 transition-all active:translate-y-0">
             + Nuevo Ticket
           </button>
        </div>

        <div class="space-y-3">
           @if (ticketService.isLoading()) {
              <div class="p-20 flex flex-col items-center justify-center opacity-40">
                 <div class="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
                 <p>Cargando tickets...</p>
              </div>
           } @else {
              @for (ticket of filteredTickets(); track ticket.id) {
                 <div [routerLink]="['/tickets', ticket.id]" class="glass-card p-5 rounded-2xl bg-white flex items-center gap-6 hover-scale cursor-pointer group border-transparent hover:border-accent/20 transition-all">
                    <div class="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center font-bold text-slate-400 group-hover:text-accent transition-colors">
                       #{{ ticket.code.split('-').pop() }}
                    </div>
                    <div class="flex-1 min-w-0">
                       <div class="flex items-center gap-2 mb-1">
                          <span class="text-xs font-bold uppercase tracking-tighter px-2 py-0.5 rounded bg-slate-100 text-slate-500">{{ ticket.type }}</span>
                          <span [class]="getStatusClass(ticket.status)" class="text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                            {{ ticket.status }}
                          </span>
                       </div>
                       <h4 class="font-bold text-slate-800 truncate">{{ ticket.subject }}</h4>
                       <p class="text-xs text-slate-400 truncate mt-1">
                         {{ ticket.reporter?.name || 'Usuario' }} · {{ ticket.created_at | date:'short' }}
                       </p>
                    </div>
                    <div class="flex items-center gap-4">
                       <div class="text-right hidden md:block">
                          <p class="text-xs font-bold text-slate-600">Prioridad</p>
                          <p class="text-[10px] font-medium text-slate-400">{{ ticket.priority }}</p>
                       </div>
                       <span class="text-slate-200 group-hover:text-slate-400 transition-colors">→</span>
                    </div>
                 </div>
              } @empty {
                 <div class="p-20 text-center text-slate-400 italic">
                    No se encontraron tickets con los criterios seleccionados.
                 </div>
              }
           }
        </div>
      </div>
    </div>
  `
})
export class TicketListComponent implements OnInit {
  ticketService = inject(TicketService);
  
  // Signals para estado local
  activeFilter = signal<string>('ALL');
  searchQuery = signal<string>('');

  // Signal computado para la lista filtrada (Best Practice: Derived State)
  filteredTickets = computed(() => {
    let tickets = this.ticketService.tickets();
    const filter = this.activeFilter();
    const query = this.searchQuery().toLowerCase();

    // Filtro por tipo
    if (filter === 'OPEN') {
      tickets = tickets.filter(t => t.status === TicketStatus.OPEN);
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

    return tickets;
  });

  // Contador computado
  openTicketsCount = computed(() => 
    this.ticketService.tickets().filter(t => t.status === TicketStatus.OPEN).length
  );

  ngOnInit() {
    this.ticketService.getTickets().subscribe();
  }

  filter(type: string) {
    this.activeFilter.set(type);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case TicketStatus.OPEN: return 'bg-amber-100 text-amber-600';
      case TicketStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-600';
      case TicketStatus.RESOLVED: return 'bg-green-100 text-green-600';
      case TicketStatus.CLOSED: return 'bg-slate-100 text-slate-500';
      default: return 'bg-slate-100 text-slate-500';
    }
  }
}
