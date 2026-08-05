import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { SiiAdminService, SiiEnablementRequest } from '@core/services/sii-admin.service';
import { NotificationService } from '@core/services/notification.service';

/**
 * Cola cross-tenant de solicitudes de habilitación de producción SII.
 * Consume SiiAdminService (v1/support/sii/enablement-requests). El acceso ya
 * está gobernado por el guard admin del backend (support.staff + admin.only).
 */
@Component({
  selector: 'app-sii-enablement-queue',
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="h-full flex flex-col bg-[#f8fafc] text-slate-800 overflow-hidden font-sans">
      <div class="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shrink-0 shadow-sm">
        <div class="flex items-center gap-5">
          <a
            routerLink="/subscribers"
            class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-100"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </a>
          <div>
            <h1 class="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">
              Habilitación de Producción SII
            </h1>
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">
              Cola cross-tenant · Certificación → Producción
            </p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <select
            [value]="statusFilter()"
            (change)="onFilterChange($event)"
            class="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest cursor-pointer"
          >
            <option value="pending">Pendientes</option>
            <option value="approved">Aprobadas</option>
            <option value="rejected">Rechazadas</option>
          </select>
          <button
            (click)="reload()"
            class="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-sm cursor-pointer"
          >
            Actualizar
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-auto custom-scrollbar p-8">
        <div class="max-w-[1200px] mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          @if (loading()) {
            <div class="py-16 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">
              Cargando solicitudes…
            </div>
          } @else {
            <table class="w-full text-left">
              <thead>
                <tr class="text-slate-400 border-b border-slate-100">
                  <th class="px-6 py-3 text-[9px] font-black uppercase tracking-widest">Empresa</th>
                  <th class="px-6 py-3 text-[9px] font-black uppercase tracking-widest">Solicitado</th>
                  <th class="px-6 py-3 text-[9px] font-black uppercase tracking-widest">Resolución declarada</th>
                  <th class="px-6 py-3 text-[9px] font-black uppercase tracking-widest">Notas</th>
                  <th class="px-6 py-3 text-[9px] font-black uppercase tracking-widest text-right">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (request of requests(); track request.id) {
                  <tr class="hover:bg-slate-50 transition-colors align-top">
                    <td class="px-6 py-4">
                      <span class="text-xs font-black text-slate-800">{{ request.company_name || '—' }}</span>
                      <span class="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1"
                        >Empresa #{{ request.company_id }}</span
                      >
                    </td>
                    <td class="px-6 py-4 text-xs font-bold text-slate-600">{{ request.requested_at || '—' }}</td>
                    <td class="px-6 py-4 text-xs font-bold text-slate-600">
                      @if (request.resolution_num) {
                        N° {{ request.resolution_num }} @if (request.resolution_date) { ({{ request.resolution_date }}) }
                      } @else {
                        <span class="opacity-40 italic">Sin declarar</span>
                      }
                    </td>
                    <td class="px-6 py-4 text-xs font-medium text-slate-500 max-w-xs">{{ request.notes || '—' }}</td>
                    <td class="px-6 py-4 text-right">
                      @if (request.status === 'pending') {
                        <div class="flex flex-col items-end gap-2">
                          <div class="flex gap-2">
                            <button
                              (click)="approve(request.id)"
                              [disabled]="approvingId() === request.id"
                              class="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 hover:bg-emerald-100 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                            >
                              Aprobar
                            </button>
                            <button
                              (click)="startRejecting(request.id)"
                              class="px-4 py-2 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 hover:bg-red-100 transition-all active:scale-95 cursor-pointer"
                            >
                              Rechazar
                            </button>
                          </div>
                          @if (rejectingId() === request.id) {
                            <div class="flex flex-col items-end gap-2 mt-2 w-64">
                              <input
                                type="text"
                                [formControl]="rejectReasonCtrl"
                                placeholder="Motivo del rechazo"
                                class="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-red-400 focus:outline-none"
                              />
                              <button
                                (click)="confirmReject(request.id)"
                                [disabled]="rejectReasonCtrl.invalid"
                                class="px-4 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all active:scale-95 disabled:opacity-40 cursor-pointer"
                              >
                                Confirmar rechazo
                              </button>
                            </div>
                          }
                        </div>
                      } @else {
                        <span
                          class="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border"
                          [class]="request.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-500 border-red-100'"
                        >
                          {{ request.status === 'approved' ? 'Aprobada' : 'Rechazada' }}
                        </span>
                      }
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="py-16 text-center opacity-30 italic text-xs font-bold">
                      No hay solicitudes en este estado.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        overflow: hidden;
      }
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #e2e8f0;
        border-radius: 10px;
      }
    `,
  ],
})
export class SiiEnablementQueueComponent {
  private _service = inject(SiiAdminService);
  private _notification = inject(NotificationService);

  requests = signal<SiiEnablementRequest[]>([]);
  loading = signal(false);
  statusFilter = signal('pending');
  approvingId = signal<number | null>(null);
  rejectingId = signal<number | null>(null);

  rejectReasonCtrl = new FormControl('', { nonNullable: true, validators: [Validators.required] });

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading.set(true);
    this._service
      .listEnablementRequests(this.statusFilter())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => this.requests.set(res?.data?.records ?? []),
        error: () => this._notification.error('No se pudieron cargar las solicitudes de habilitación.'),
      });
  }

  onFilterChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.statusFilter.set(value);
    this.reload();
  }

  approve(id: number): void {
    this.approvingId.set(id);
    this._service
      .approveEnablement(id)
      .pipe(finalize(() => this.approvingId.set(null)))
      .subscribe({
        next: () => {
          this._notification.success('Solicitud aprobada. Empresa habilitada en producción.');
          this.reload();
        },
        error: (err) => this._notification.error(err?.error?.message ?? 'No se pudo aprobar la solicitud.'),
      });
  }

  startRejecting(id: number): void {
    this.rejectingId.set(id);
    this.rejectReasonCtrl.reset('');
  }

  confirmReject(id: number): void {
    if (this.rejectReasonCtrl.invalid) return;

    this._service.rejectEnablement(id, this.rejectReasonCtrl.value).subscribe({
      next: () => {
        this._notification.success('Solicitud rechazada.');
        this.rejectingId.set(null);
        this.reload();
      },
      error: (err) => this._notification.error(err?.error?.message ?? 'No se pudo rechazar la solicitud.'),
    });
  }
}
