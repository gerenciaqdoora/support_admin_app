import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { SiiAdminService, SiiCaf, SiiCertificate } from '@core/services/sii-admin.service';
import { NotificationService } from '@core/services/notification.service';
import { AuthService } from '@core/services/auth.service';

/**
 * Override administrativo (Portal Soporte) del certificado digital y CAF de una
 * empresa. Consume SiiAdminService (v1/support/companies/{id}/sii). El acceso ya
 * está gobernado por el guard admin del backend; la UI refuerza con isAdminRole.
 */
@Component({
  selector: 'app-sii-manager',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="h-full flex flex-col bg-[#f8fafc] text-slate-800 overflow-hidden font-sans">
      <!-- Header -->
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
            <div class="flex items-center gap-3">
              <h1 class="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">
                Gestión SII
              </h1>
              <span class="text-[10px] font-black px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-widest">
                Empresa #{{ companyId() }}
              </span>
            </div>
            <div class="flex items-center gap-2 mt-2">
              <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Override administrativo · Certificado y Folios
              </p>
            </div>
          </div>
        </div>
        <button
          (click)="reload()"
          class="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-sm cursor-pointer"
        >
          Actualizar
        </button>
      </div>

      <div class="flex-1 overflow-auto custom-scrollbar">
        <div class="max-w-[1200px] mx-auto p-8 grid grid-cols-12 gap-8">
          <!-- Columna Izquierda: Ambiente y Certificado -->
          <div class="col-span-12 lg:col-span-5 space-y-6">
            
            <!-- Ambiente SII (rollback) -->
            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div class="px-8 py-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h3 class="text-xs font-black text-slate-900 uppercase tracking-widest">Ambiente SII</h3>
                <span
                  class="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border"
                  [class]="inProduction() ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'"
                >
                  {{ inProduction() ? 'Producción' : 'Certificación' }}
                </span>
              </div>
              <div class="p-8">
                @if (inProduction()) {
                  <p class="text-[11px] text-slate-500 mb-6 font-medium leading-relaxed">
                    Devolver la empresa a certificación detiene la emisión de documentos reales. Queda registrado con el motivo indicado.
                  </p>
                  <form (ngSubmit)="rollbackToCertification()" class="space-y-4">
                    <label class="block">
                      <span class="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Motivo del rollback
                      </span>
                      <input
                        type="text"
                        [formControl]="rollbackReasonCtrl"
                        placeholder="Por qué vuelve a certificación"
                        class="block w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-amber-400 focus:outline-none"
                      />
                    </label>
                    <button
                      type="submit"
                      [disabled]="loadingEnv() || rollbackReasonCtrl.invalid"
                      class="w-full py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      Volver a certificación
                    </button>
                  </form>
                } @else {
                  <p class="text-[11px] text-slate-500 font-medium leading-relaxed">
                    La empresa opera contra el ambiente de certificación del SII. El paso a producción se otorga desde el asistente de certificación, con el checklist cerrado y la resolución del SII declarada.
                  </p>
                }
              </div>
            </div>

            <!-- Certificado -->
            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div class="px-8 py-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h3 class="text-xs font-black text-slate-900 uppercase tracking-widest">Certificado Digital</h3>
                @if (certificate(); as cert) {
                  <span
                    class="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border"
                    [class]="certStatusClass(cert.status)"
                  >
                    {{ certStatusLabel(cert.status) }}
                  </span>
                }
              </div>

              <div class="p-8">
                @if (loadingCert()) {
                  <div class="py-10 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    Cargando certificado…
                  </div>
                } @else if (certificate(); as cert) {
                  <dl class="space-y-4">
                    <div class="flex justify-between items-center">
                      <dt class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Titular</dt>
                      <dd class="text-xs font-black text-slate-800 text-right">{{ cert.holder_name || '—' }}</dd>
                    </div>
                    <div class="flex justify-between items-center">
                      <dt class="text-[10px] font-black text-slate-400 uppercase tracking-widest">RUT titular</dt>
                      <dd class="text-xs font-black text-slate-800 text-right">{{ cert.holder_rut || '—' }}</dd>
                    </div>
                    <div class="flex justify-between items-center">
                      <dt class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vigencia</dt>
                      <dd class="text-xs font-bold text-slate-600 text-right">
                        {{ (cert.valid_from | date: 'dd/MM/yyyy') || '—' }} → {{ (cert.valid_until | date: 'dd/MM/yyyy') || '—' }}
                      </dd>
                    </div>
                    <div class="flex justify-between items-center">
                      <dt class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Días restantes</dt>
                      <dd class="text-sm font-black text-right" [class]="cert.days_until_expiry !== null && cert.days_until_expiry <= 30 ? 'text-amber-600' : 'text-slate-800'">
                        {{ cert.days_until_expiry ?? '—' }}
                      </dd>
                    </div>
                  </dl>

                  <div class="grid grid-cols-2 gap-3 mt-8">
                    <button
                      (click)="testConnection()"
                      [disabled]="testing()"
                      class="px-4 py-3 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-100 hover:bg-blue-100 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                    >
                      @if (testing()) {
                        <span class="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                      }
                      Probar conexión
                    </button>
                    @if (isAdmin()) {
                      <button
                        (click)="deleteCertificate(cert.id)"
                        [disabled]="deleting()"
                        class="px-4 py-3 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100 hover:bg-red-100 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                      >
                        Desactivar
                      </button>
                    }
                  </div>
                } @else {
                  <div class="py-6 text-center">
                    <div class="w-16 h-16 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4 border border-amber-100">🔐</div>
                    <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest">Sin certificado activo</p>
                  </div>
                }

                <!-- Carga / reemplazo -->
                @if (isAdmin()) {
                  <div class="mt-8 pt-8 border-t border-slate-100">
                    <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">
                      {{ certificate() ? 'Reemplazar certificado' : 'Cargar certificado' }}
                    </p>
                    <input
                      type="file"
                      accept=".p12,.pfx"
                      (change)="onCertFile($event)"
                      class="block w-full text-[11px] text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-slate-100 file:text-slate-600 hover:file:bg-slate-200 cursor-pointer mb-3"
                    />
                    <input
                      type="password"
                      [formControl]="passwordCtrl"
                      placeholder="Contraseña del .p12"
                      class="block w-full px-4 py-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:border-blue-400 focus:outline-none mb-4"
                    />
                    <button
                      (click)="uploadCertificate()"
                      [disabled]="uploadingCert() || !certFile() || passwordCtrl.invalid"
                      class="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                    >
                      @if (uploadingCert()) {
                        <span class="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                      }
                      Subir certificado
                    </button>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Columna Derecha: Asistente y CAF -->
          <div class="col-span-12 lg:col-span-7 space-y-6">
            
            <!-- Asistente de Certificación -->
            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div class="px-8 py-5 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </div>
                <h3 class="text-xs font-black text-slate-900 uppercase tracking-widest">Asistente de Certificación SII</h3>
              </div>
              <div class="p-8">
                <p class="text-xs text-slate-500 font-medium mb-6 leading-relaxed">
                  Checklist del proceso ante el SII, Set de Pruebas y habilitación de producción de esta empresa.
                </p>
                <a
                  [routerLink]="['/admin/sii-certification', companyId()]"
                  class="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 cursor-pointer"
                >
                  Abrir asistente
                </a>
              </div>
            </div>

            <!-- CAF / Folios -->
            <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div class="px-8 py-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <h3 class="text-xs font-black text-slate-900 uppercase tracking-widest">Folios (CAF)</h3>
                <span class="px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-[10px] font-black text-slate-500">
                  {{ cafs().length }} rangos
                </span>
              </div>

              <div class="p-4">
                @if (loadingCafs()) {
                  <div class="py-10 text-center text-[11px] font-black text-slate-400 uppercase tracking-widest">Cargando folios…</div>
                } @else {
                  <table class="w-full text-left">
                    <thead>
                      <tr class="text-slate-400">
                        <th class="px-4 py-2 text-[9px] font-black uppercase tracking-widest">Tipo</th>
                        <th class="px-4 py-2 text-[9px] font-black uppercase tracking-widest">Rango</th>
                        <th class="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-right">Próximo</th>
                        <th class="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-right">Restantes</th>
                        <th class="px-4 py-2 text-[9px] font-black uppercase tracking-widest">Consumo</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      @for (caf of cafs(); track caf.id) {
                        <tr class="hover:bg-slate-50 transition-colors">
                          <td class="px-4 py-4">
                            <div class="flex items-center gap-2">
                              <span class="text-[10px] font-black text-slate-800 px-2 py-0.5 bg-slate-100 rounded shrink-0">{{ caf.doc_tributary_code }}</span>
                              @if (caf.doc_name) {
                                <span class="text-[11px] font-bold text-slate-600 leading-tight">{{ caf.doc_name }}</span>
                              }
                            </div>
                            <span
                              class="block mt-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded w-fit border"
                              [class]="caf.environment === 'produccion' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'"
                            >{{ caf.environment === 'produccion' ? 'Producción' : 'Certificación' }}</span>
                          </td>
                          <td class="px-4 py-4 text-[10px] font-bold text-slate-600">{{ caf.folio_from }}–{{ caf.folio_to }}</td>
                          <td class="px-4 py-4 text-right text-xs font-black text-slate-800">{{ caf.next_folio }}</td>
                          <td class="px-4 py-4 text-right">
                            <span class="text-xs font-black" [class]="caf.is_exhausted ? 'text-red-500' : 'text-slate-800'">{{ caf.remaining_folios }}</span>
                          </td>
                          <td class="px-4 py-4">
                            <div class="flex items-center gap-2">
                              <div class="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden min-w-[60px]">
                                <div class="h-full rounded-full" [class]="caf.consumed_pct >= 90 ? 'bg-red-500' : caf.consumed_pct >= 70 ? 'bg-amber-500' : 'bg-blue-500'" [style.width.%]="caf.consumed_pct"></div>
                              </div>
                              <span class="text-[9px] font-black text-slate-400 w-8 text-right">{{ caf.consumed_pct }}%</span>
                            </div>
                          </td>
                        </tr>
                      } @empty {
                        <tr>
                          <td colspan="5" class="py-12 text-center opacity-30 italic text-xs font-bold">No hay folios cargados para esta empresa.</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }

                @if (isAdmin()) {
                  <div class="mt-6 pt-6 border-t border-slate-100 px-4 pb-2">
                    <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Cargar nuevo CAF (XML)</p>
                    <p class="text-[11px] text-slate-500 font-medium mb-4 leading-relaxed">
                      Se registrará como folio de
                      <span class="font-black" [class]="inProduction() ? 'text-emerald-600' : 'text-amber-600'">{{ inProduction() ? 'producción' : 'certificación' }}</span>,
                      según el ambiente actual de la empresa. El ambiente no se elige aquí.
                    </p>
                    <div class="flex items-center gap-3">
                      <input
                        type="file"
                        accept=".xml"
                        (change)="onCafFile($event)"
                        class="block flex-1 text-[11px] text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-slate-100 file:text-slate-600 hover:file:bg-slate-200 cursor-pointer"
                      />
                      <button
                        (click)="uploadCaf()"
                        [disabled]="uploadingCaf() || !cafFile()"
                        class="px-6 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                      >
                        @if (uploadingCaf()) {
                          <span class="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                        }
                        Subir CAF
                      </button>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
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
export class SiiManagerComponent {
  private _route = inject(ActivatedRoute);
  private _service = inject(SiiAdminService);
  private _notification = inject(NotificationService);
  private _auth = inject(AuthService);

  companyId = signal<number>(Number(this._route.snapshot.params['companyId']));
  isAdmin = computed(() => this._auth.isAdminRole());

  certificate = signal<SiiCertificate | null>(null);
  cafs = signal<SiiCaf[]>([]);

  loadingCert = signal(false);
  loadingCafs = signal(false);
  loadingEnv = signal(false);
  uploadingCert = signal(false);
  uploadingCaf = signal(false);
  deleting = signal(false);
  testing = signal(false);

  certFile = signal<File | null>(null);
  cafFile = signal<File | null>(null);
  passwordCtrl = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  siiEnvironment = signal<string>('certificacion');
  inProduction = computed(() => this.siiEnvironment() === 'produccion');
  rollbackReasonCtrl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(10)],
  });

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loadEnvironment();
    this.loadCertificate();
    this.loadCafs();
  }

  /**
   * La API rechaza con 422 el salto a producción desde aquí: ese camino es
   * exclusivo del asistente de certificación, que exige el checklist cerrado.
   */
  rollbackToCertification(): void {
    if (this.rollbackReasonCtrl.invalid) return;

    this.loadingEnv.set(true);
    this._service
      .rollbackToCertification(this.companyId(), this.rollbackReasonCtrl.value)
      .pipe(finalize(() => this.loadingEnv.set(false)))
      .subscribe({
        next: () => {
          this._notification.success('Empresa devuelta al ambiente de certificación.');
          this.rollbackReasonCtrl.reset('');
          this.loadEnvironment();
        },
        error: (err) => this._notification.error(err?.error?.message ?? 'No se pudo cambiar el ambiente.'),
      });
  }

  private loadEnvironment(): void {
    this.loadingEnv.set(true);
    this._service
      .getEnvironment(this.companyId())
      .pipe(finalize(() => this.loadingEnv.set(false)))
      .subscribe({
        next: (res) => {
          this.siiEnvironment.set(res?.data?.sii_environment ?? 'certificacion');
        },
        error: () => this._notification.error('No se pudo cargar el ambiente actual.'),
      });
  }

  private loadCertificate(): void {
    this.loadingCert.set(true);
    this._service
      .getCertificate(this.companyId())
      .pipe(finalize(() => this.loadingCert.set(false)))
      .subscribe({
        next: (res) => this.certificate.set(res?.data?.record ?? null),
        error: () => this._notification.error('No se pudo cargar el certificado.'),
      });
  }

  private loadCafs(): void {
    this.loadingCafs.set(true);
    this._service
      .listCafs(this.companyId())
      .pipe(finalize(() => this.loadingCafs.set(false)))
      .subscribe({
        next: (res) => this.cafs.set(res?.data?.records ?? []),
        error: () => this._notification.error('No se pudieron cargar los folios.'),
      });
  }

  onCertFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.certFile.set(input.files?.[0] ?? null);
  }

  onCafFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.cafFile.set(input.files?.[0] ?? null);
  }

  uploadCertificate(): void {
    const file = this.certFile();
    if (!file || this.passwordCtrl.invalid) return;

    this.uploadingCert.set(true);
    this._service
      .uploadCertificate(this.companyId(), file, this.passwordCtrl.value)
      .pipe(finalize(() => this.uploadingCert.set(false)))
      .subscribe({
        next: () => {
          this._notification.success('Certificado cargado correctamente.');
          this.certFile.set(null);
          this.passwordCtrl.reset();
          this.loadCertificate();
        },
        error: (err) => this._notification.error(err?.error?.message ?? 'No se pudo cargar el certificado.'),
      });
  }

  deleteCertificate(id: number): void {
    this.deleting.set(true);
    this._service
      .deleteCertificate(this.companyId(), id)
      .pipe(finalize(() => this.deleting.set(false)))
      .subscribe({
        next: () => {
          this._notification.success('Certificado desactivado.');
          this.loadCertificate();
        },
        error: (err) => this._notification.error(err?.error?.message ?? 'No se pudo desactivar el certificado.'),
      });
  }

  testConnection(): void {
    this.testing.set(true);
    this._service
      .testConnection(this.companyId())
      .pipe(finalize(() => this.testing.set(false)))
      .subscribe({
        next: () => this._notification.success('Conexión con el SII establecida correctamente.'),
        error: (err) => this._notification.error(err?.error?.message ?? 'No se pudo conectar con el SII.'),
      });
  }

  uploadCaf(): void {
    const file = this.cafFile();
    if (!file) return;

    this.uploadingCaf.set(true);
    this._service
      .uploadCaf(this.companyId(), file)
      .pipe(finalize(() => this.uploadingCaf.set(false)))
      .subscribe({
        next: () => {
          this._notification.success('CAF cargado correctamente.');
          this.cafFile.set(null);
          this.loadCafs();
        },
        error: (err) => this._notification.error(err?.error?.message ?? 'No se pudo cargar el CAF.'),
      });
  }

  certStatusClass(status: SiiCertificate['status']): string {
    switch (status) {
      case 'valid':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'expiring':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'expired':
        return 'bg-red-50 text-red-500 border-red-100';
      default:
        return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  }

  certStatusLabel(status: SiiCertificate['status']): string {
    const labels: Record<string, string> = {
      valid: 'Vigente',
      expiring: 'Por vencer',
      expired: 'Vencido',
      unknown: 'Sin datos',
    };
    return labels[status] ?? status;
  }
}
