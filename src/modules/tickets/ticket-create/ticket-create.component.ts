import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TicketService } from '@core/services/ticket.service';
import { SubscriberService } from '@core/services/subscriber.service';
import { TicketPriority, TicketStatus, LoggerEvent } from '@core/models/support.models';

@Component({
  selector: 'app-ticket-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-300 border border-slate-200">
        
        <!-- Header -->
        <header class="p-6 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50/50">
          <div class="flex items-center gap-4">
            <div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            </div>
            <div>
              <h1 class="text-[16px] font-bold text-slate-900 tracking-tight leading-none uppercase">CREAR NUEVA INCIDENCIA</h1>
              <p class="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">QDOORA SERVICE MANAGEMENT</p>
            </div>
          </div>
          <button routerLink="/tickets" class="p-2 hover:bg-slate-200/50 rounded-lg transition-all text-slate-400 hover:text-slate-900 cursor-pointer">
             <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </header>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
          
          <!-- Section 1: Contexto -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">SUSCRIPTOR SOLICITANTE</label>
              <div class="relative">
                <select [(ngModel)]="form.suscriptor_id" (change)="onSubscriberChange()"
                  class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 focus:ring-2 ring-blue-500/10 outline-none appearance-none cursor-pointer transition-all hover:border-slate-300 uppercase">
                  <option [ngValue]="undefined">SELECCIONAR CLIENTE...</option>
                  @for (sub of subscriberService.subscribers(); track sub.id) {
                    <option [value]="sub.id">{{ sub.usuario?.name | uppercase }}</option>
                  }
                </select>
                <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-[8px]">▼</div>
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">EMPRESA ASOCIADA</label>
              <div class="relative">
                <select [(ngModel)]="form.company_id" [disabled]="!form.suscriptor_id"
                  class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 focus:ring-2 ring-blue-500/10 outline-none appearance-none cursor-pointer transition-all hover:border-slate-300 disabled:opacity-30 uppercase">
                  <option [ngValue]="undefined">SELECCIONAR EMPRESA...</option>
                  @for (comp of selectedSubscriberCompanies(); track comp.id) {
                    <option [value]="comp.id">{{ comp.social_reason | uppercase }}</option>
                  }
                </select>
                <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 text-[8px]">▼</div>
              </div>
            </div>
          </div>

          <!-- Section 2: Tipo & Prioridad -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">TIPO DE INCIDENCIA</label>
              <div class="grid grid-cols-2 gap-1.5">
                @for (type of ticketTypes; track type.value) {
                  <button (click)="form.type = type.value"
                    [class.bg-slate-900]="form.type === type.value"
                    [class.text-white]="form.type === type.value"
                    [class.bg-slate-50]="form.type !== type.value"
                    [class.text-slate-500]="form.type !== type.value"
                    class="py-2.5 rounded-lg text-[9px] font-bold uppercase tracking-tight border border-transparent transition-all cursor-pointer hover:border-slate-200"
                    [class.border-slate-900]="form.type === type.value">
                    {{ type.label | uppercase }}
                  </button>
                }
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">PRIORIDAD DEL NEGOCIO</label>
              <div class="grid grid-cols-2 gap-1.5">
                @for (p of priorities; track p.value) {
                  <button (click)="form.priority = p.value"
                    [class.bg-blue-600]="form.priority === p.value"
                    [class.text-white]="form.priority === p.value"
                    [class.bg-slate-50]="form.priority !== p.value"
                    [class.text-slate-500]="form.priority !== p.value"
                    class="py-2.5 rounded-lg text-[9px] font-bold uppercase tracking-tight border border-transparent transition-all cursor-pointer hover:border-slate-200"
                    [class.border-blue-600]="form.priority === p.value">
                    {{ p.label }}
                  </button>
                }
              </div>
            </div>
          </div>

          <!-- Section 3: Etiquetas del Sistema -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">ETIQUETAS DEL SISTEMA (SELECCIONAR VARIAS)</label>
              <span class="text-[8px] font-black text-blue-500 uppercase">{{ selectedTags().length }} SELECCIONADAS</span>
            </div>
            <div class="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto p-1 border border-slate-100 rounded-xl bg-slate-50/30 custom-scrollbar">
              @for (tag of availableTags; track tag) {
                <button (click)="toggleTag(tag)"
                  [class.bg-blue-600]="selectedTags().includes(tag)"
                  [class.text-white]="selectedTags().includes(tag)"
                  [class.border-blue-600]="selectedTags().includes(tag)"
                  [class.bg-white]="!selectedTags().includes(tag)"
                  [class.text-slate-500]="!selectedTags().includes(tag)"
                  [class.border-slate-200]="!selectedTags().includes(tag)"
                  class="px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-tight border transition-all cursor-pointer hover:border-blue-300 shadow-sm active:scale-95">
                  {{ tag }}
                </button>
              }
            </div>
          </div>

          <!-- Section 4: Contenido -->
          <div class="space-y-3">
            <div class="space-y-1.5">
              <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">RESUMEN DEL INCIDENTE</label>
              <input type="text" [(ngModel)]="form.subject" placeholder="TÍTULO CORTO Y DESCRIPTIVO..."
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-900 focus:ring-2 ring-blue-500/10 outline-none transition-all uppercase placeholder:text-slate-300">
            </div>
            <div class="space-y-1.5">
              <label class="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">DETALLES TÉCNICOS</label>
              <textarea [(ngModel)]="form.description" rows="4" placeholder="PROPORCIONA DETALLES, CAPTURAS O CONTEXTO DEL ERROR..."
                class="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-medium text-slate-700 focus:ring-2 ring-blue-500/10 outline-none transition-all resize-none uppercase placeholder:text-slate-300"></textarea>
            </div>
          </div>

        </div>

        <!-- Footer -->
        <footer class="p-6 border-t border-slate-200 flex items-center justify-between bg-slate-50/50 shrink-0">
          <button routerLink="/tickets" class="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors cursor-pointer">
            CANCELAR OPERACIÓN
          </button>
          <button (click)="save()" [disabled]="!isFormValid() || isSaving()"
            class="px-8 py-3 bg-blue-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-30 cursor-pointer">
            {{ isSaving() ? 'SINCRONIZANDO...' : 'CREAR INCIDENCIA AHORA' }}
          </button>
        </footer>

      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 3px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  `]
})
export class TicketCreateComponent {
  private _ticketService = inject(TicketService);
  private _router = inject(Router);
  public subscriberService = inject(SubscriberService);

  isSaving = signal(false);
  priorities = [
    { value: TicketPriority.LOW, label: 'BAJA' },
    { value: TicketPriority.MEDIUM, label: 'MEDIA' },
    { value: TicketPriority.HIGH, label: 'ALTA' },
    { value: TicketPriority.URGENT, label: 'URGENTE' }
  ];

  // etiquetas del sistema
  availableTags = Object.values(LoggerEvent);
  selectedTags = signal<string[]>([]);

  toggleTag(tag: string) {
    const current = this.selectedTags();
    if (current.includes(tag)) {
      this.selectedTags.set(current.filter(t => t !== tag));
    } else {
      this.selectedTags.set([...current, tag]);
    }
  }
  ticketTypes = [
    { value: 'INCIDENT', label: 'INCIDENTE' },
    { value: 'BUG', label: 'ERROR / BUG' },
    { value: 'ACCOUNTING', label: 'CONTABILIDAD' },
    { value: 'INVOICING', label: 'FACTURACIÓN' },
    { value: 'PAYROLL', label: 'NÓMINA' },
    { value: 'CUSTOMS', label: 'ADUANAS' }
  ];

  form = {
    suscriptor_id: undefined as number | undefined,
    company_id: undefined as number | undefined,
    subject: '',
    description: '',
    priority: TicketPriority.MEDIUM,
    type: 'INCIDENT',
    related_documents: [] as any[]
  };

  docSearchQuery = '';

  addDocumentLink(doc: any) {
    if (!this.form.related_documents.find(d => d.id === doc.id)) {
      this.form.related_documents.push(doc);
    }
    this.docSearchQuery = '';
  }

  removeDocumentLink(id: number) {
    this.form.related_documents = this.form.related_documents.filter(d => d.id !== id);
  }

  selectedSubscriberCompanies = computed(() => {
    const subId = this.form.suscriptor_id;
    if (!subId) return [];
    const sub = this.subscriberService.subscribers().find(s => s.id == subId);
    return sub?.empresas || [];
  });

  onSubscriberChange() {
    this.form.company_id = undefined;
  }

  isFormValid(): boolean {
    return !!(this.form.suscriptor_id && this.form.subject.trim() && this.form.description.trim() && this.form.type);
  }

  save() {
    if (!this.isFormValid()) return;
    
    this.isSaving.set(true);
    this._ticketService.createTicket(this.form).subscribe({
      next: (ticket) => {
        // El servicio ya refresca la lista, aquí solo navegamos al detalle
        if (ticket && ticket.id) {
          this._router.navigate(['/tickets', ticket.id]);
        } else {
          this._router.navigate(['/tickets']);
        }
      },
      error: () => this.isSaving.set(false)
    });
  }
}
