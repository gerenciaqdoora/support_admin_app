import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, finalize } from 'rxjs';
import { ImportWizardService } from '@core/services/import-wizard.service';
import { NotificationService } from '@core/services/notification.service';
import { QdooraAlertService } from '@core/components/alert/alert.service';
import { ImportStep, ImportWizardOverview } from '@core/models/import-wizard.model';
import { SharedAlertComponent } from '@shared/alert/alert.component';
import { ImportWizardRouteData } from './import-wizard.resolver';
import {
  StepBucket, StepFilter, bucketClass, bucketLabel, countByStatus, dependencyTitles, filterSteps, nextStep,
  openLabel, paginate, progressPercent, segmentWidth, stepBucket, stepLink, summaryText,
} from './import-wizard.utils';

const ALERT = 'import-wizard';

const FILTERS: { key: StepFilter; label: string }[] = [
  { key: 'all', label: 'Todos' }, { key: 'pending', label: 'Pendientes' }, { key: 'in_progress', label: 'En curso' },
  { key: 'blocked', label: 'Bloqueados' }, { key: 'completed', label: 'Completados' }, { key: 'not_applicable', label: 'No aplica' },
];

/** Asistente de importaciones de Aduana: qué pasos de carga inicial están completos y cuáles faltan (ADMIN_ROLE). */
@Component({
  selector: 'app-import-wizard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, SharedAlertComponent],
  host: { class: 'block h-full overflow-hidden' },
  template: `
    <div class="h-full flex flex-col bg-[#f8fafc] text-slate-800 overflow-hidden font-sans">
      <div class="bg-white border-b border-slate-200 px-8 py-3 flex justify-between items-center shrink-0 z-50 shadow-sm relative">
        <div class="flex items-center gap-5">
          <a routerLink="/subscribers" aria-label="Volver a suscriptores" class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 hover:bg-slate-100">‹</a>
          <div class="relative">
            <div class="w-1.5 h-10 bg-blue-600 rounded-full"></div>
            <div class="absolute inset-0 bg-blue-600 blur-lg opacity-20"></div>
          </div>
          <div>
            <h1 class="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">Importaciones</h1>
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Empresa #{{ companyId }} · Carga inicial de Aduana</p>
          </div>
        </div>
      </div>

      @if (overview(); as o) {
        <section class="bg-white border-b border-slate-200 px-8 py-4 space-y-3 shrink-0" aria-label="Resumen de avance">
          <div class="flex items-center gap-4">
            <span class="text-sm font-black text-slate-900 whitespace-nowrap">{{ o.progress.completed }} de {{ o.progress.total }} resueltos · {{ percent() }} %</span>
            <div class="flex h-2 flex-1 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Avance de importaciones"
              aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="percent()">
              <div class="h-full bg-emerald-500 transition-all duration-500" [style.width.%]="widths().completed"></div>
              <div class="h-full bg-amber-400 transition-all duration-500" [style.width.%]="widths().not_applicable"></div>
              <div class="h-full bg-blue-300 transition-all duration-500" [style.width.%]="widths().in_progress"></div>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            @for (f of filters; track f.key) {
              <button type="button" (click)="setFilter(f.key)" [attr.aria-pressed]="filter() === f.key"
                class="px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-blue-600"
                [class]="filterClass(f.key)">{{ f.label }} ({{ counts()[f.key] }})</button>
            }
            <div class="ml-auto flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5">
              @if (next(); as n) {
                <span class="text-[10px] font-black uppercase tracking-widest text-slate-500">Siguiente: <span class="text-slate-900">{{ n.title }}</span></span>
                @if (link(n); as l) {
                  <a [routerLink]="l" class="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest">{{ openText(n) }}</a>
                }
              } @else {
                <span class="text-[10px] font-black uppercase tracking-widest text-emerald-700">Carga inicial completa</span>
              }
            </div>
          </div>
        </section>
      }

      <app-shared-alert [name]="alertName" class="block shrink-0 px-8"></app-shared-alert>

      <!-- Tabla: cabecera fija, scroll solo en el cuerpo, footer con paginación (mismo formato que las importaciones) -->
      <div class="flex-1 min-h-0 overflow-hidden flex flex-col bg-white">
        <div class="flex-1 overflow-auto custom-scrollbar relative min-h-0">
          @if (overview()) {
            <table class="w-full text-left text-xs border-separate border-spacing-0 min-w-[760px]">
              <caption class="sr-only">Pasos de la carga inicial de importaciones</caption>
              <thead class="sticky top-0 z-20">
                <tr class="bg-slate-500 text-white shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
                  <th scope="col" class="px-6 py-2 font-black uppercase tracking-widest text-[8px] border-r border-white/5 w-20">#</th>
                  <th scope="col" class="px-6 py-2 font-black uppercase tracking-widest text-[8px] border-r border-white/5">Paso</th>
                  <th scope="col" class="px-6 py-2 font-black uppercase tracking-widest text-[8px] border-r border-white/5 w-44">Estado</th>
                  <th scope="col" class="px-6 py-2 font-black uppercase tracking-widest text-[8px] border-r border-white/5 hidden md:table-cell">Última ejecución</th>
                  <th scope="col" class="px-6 py-2 font-black uppercase tracking-widest text-[8px] w-44 text-right">Acción</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (step of visibleSteps(); track step.code) {
                  <tr class="hover:bg-slate-50/80 transition-all border-l-[6px] border-transparent hover:border-blue-600" [class.bg-blue-50]="isOpen(step.code)">
                    <td class="px-6 py-1.5 text-slate-500 font-bold text-[10px]">{{ step.order }}</td>
                    <td class="px-6 py-1.5">
                      <button type="button" (click)="toggle(step.code)" [attr.aria-expanded]="isOpen(step.code)" [attr.aria-controls]="'step-detail-' + step.code"
                        class="flex items-center gap-2 text-[11px] font-black uppercase text-slate-800 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600">
                        <span aria-hidden="true" class="text-slate-400">{{ isOpen(step.code) ? '▾' : '▸' }}</span>{{ step.title }}
                      </button>
                    </td>
                    <td class="px-6 py-1.5">
                      <span class="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border" [class]="bucketChip(step)">{{ bucketText(step) }}</span>
                    </td>
                    <td class="px-6 py-1.5 hidden md:table-cell font-bold text-slate-700 text-[11px]">{{ summary(step) }}</td>
                    <td class="px-6 py-1.5 text-right">
                      @if (link(step); as l) {
                        @if (bucketOf(step) === 'blocked') {
                          <span class="inline-block px-3 py-1 rounded-lg bg-slate-100 text-slate-400 text-[9px] font-black uppercase tracking-widest cursor-not-allowed" aria-disabled="true">{{ openText(step) }}</span>
                        } @else {
                          <a [routerLink]="l" class="inline-block px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest transition-all active:scale-95">{{ openText(step) }}</a>
                        }
                      }
                    </td>
                  </tr>
                  @if (isOpen(step.code)) {
                    <tr [id]="'step-detail-' + step.code" class="bg-slate-50">
                      <td class="border-l-[6px] border-blue-600"></td>
                      <td colspan="4" class="px-6 py-3">
                        <p class="text-xs text-slate-600">{{ step.description }}</p>
                        @if (step.summary && step.summary.last_at) {
                          <p class="mt-1 text-[10px] font-bold text-slate-500">Última ejecución: {{ step.summary.last_at | date: 'dd/MM/yyyy HH:mm' }}</p>
                        }
                        @if (bucketOf(step) === 'blocked') {
                          <p class="mt-2 text-[10px] font-black text-amber-700">{{ step.blocked_reason }} @if (deps(step)) { Depende de: {{ deps(step) }}. }</p>
                        }
                        <div class="mt-2">
                          @if (step.status === 'pending') {
                            <button type="button" (click)="markNotApplicable(step)" [disabled]="busy()"
                              class="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 hover:underline cursor-pointer disabled:opacity-40">Marcar como no aplica</button>
                          } @else if (step.status === 'not_applicable') {
                            <button type="button" (click)="unmark(step)" [disabled]="busy()"
                              class="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 hover:underline cursor-pointer disabled:opacity-40">Deshacer</button>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                } @empty {
                  <tr><td colspan="5" class="p-10 text-center text-[11px] font-black uppercase tracking-widest text-slate-400">Sin pasos para este filtro</td></tr>
                }
              </tbody>
            </table>
          }
        </div>

        <footer class="bg-slate-500 border-t border-white/10 px-8 py-3 flex justify-between items-center shrink-0 z-30 shadow-[0_-15px_40px_rgba(0,0,0,0.15)]">
          <div class="flex items-center gap-8 text-white">
            <div class="flex items-center gap-4">
              <label for="wizard-page-size" class="text-[9px] font-black uppercase tracking-widest opacity-60">Visualizar</label>
              <select id="wizard-page-size" (change)="setSize(+$any($event.target).value)"
                class="bg-white/10 border border-white/20 text-white rounded-xl px-4 py-1.5 text-[10px] font-black outline-none cursor-pointer hover:bg-white/20 transition-all">
                @for (n of sizes; track n) {
                  <option [value]="n" [selected]="size() === n" class="text-slate-800">{{ n }} REGISTROS</option>
                }
              </select>
            </div>
            <div class="h-6 w-px bg-white/10"></div>
            <span class="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">
              PÁGINA {{ pagination().page + 1 }} DE {{ pagination().lastPage + 1 }} · {{ pagination().startIndex }}–{{ pagination().endIndex }} DE {{ pagination().length }}
            </span>
          </div>
          <div class="flex gap-4">
            <button type="button" (click)="goTo(pagination().page - 1)" [disabled]="pagination().page === 0"
              class="px-6 py-2 bg-white/5 hover:bg-white/15 text-white rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95">
              Anterior
            </button>
            <button type="button" (click)="goTo(pagination().page + 1)" [disabled]="pagination().page >= pagination().lastPage"
              class="px-8 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl border border-blue-400/40 text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-950/30 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95">
              Siguiente
            </button>
          </div>
        </footer>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
  `],
})
export class ImportWizardComponent implements OnDestroy {
  private _route = inject(ActivatedRoute);
  private _api = inject(ImportWizardService);
  private _notification = inject(NotificationService);
  private _alert = inject(QdooraAlertService);
  private _destroyRef = inject(DestroyRef);

  private readonly data = this._route.snapshot.data['wizardData'] as ImportWizardRouteData;
  readonly companyId = this.data.companyId;
  readonly alertName = ALERT;

  readonly overview = signal<ImportWizardOverview | null>(this.data.overview);
  readonly busy = signal(false);
  readonly percent = computed(() => {
    const o = this.overview();
    return o ? progressPercent(o.progress) : 0;
  });

  constructor() {
    if (this.data.error) {
      this._alert.showAlert({ appearance: 'border', type: 'error', name: ALERT, message: this.data.error });
    }
  }

  ngOnDestroy(): void {
    this._alert.clearAlert(ALERT);
  }

  readonly filters = FILTERS;
  readonly filter = signal<StepFilter>('all');
  readonly expanded = signal<string | null>(null);

  private readonly steps = computed(() => this.overview()?.steps ?? []);
  readonly counts = computed(() => countByStatus(this.steps()));
  readonly sizes = [10, 20, 50];
  readonly size = signal(10);
  readonly page = signal(0);
  private readonly pageData = computed(() => paginate(filterSteps(this.steps(), this.filter()), this.page(), this.size()));
  readonly visibleSteps = computed(() => this.pageData().records);
  readonly pagination = computed(() => this.pageData().pagination);
  readonly next = computed(() => nextStep(this.steps()));
  readonly widths = computed(() => {
    const c = this.counts();

    return {
      completed: segmentWidth(c.completed, c.all),
      not_applicable: segmentWidth(c.not_applicable, c.all),
      in_progress: segmentWidth(c.in_progress, c.all),
    };
  });

  bucketOf(step: ImportStep): StepBucket { return stepBucket(step); }
  bucketText(step: ImportStep): string { return bucketLabel(stepBucket(step)); }
  bucketChip(step: ImportStep): string { return bucketClass(stepBucket(step)); }
  summary(step: ImportStep): string { return summaryText(step); }
  deps(step: ImportStep): string { return dependencyTitles(step, this.steps()).join(', '); }
  openText(step: ImportStep): string { return openLabel(step.status); }
  link(step: ImportStep): (string | number)[] | null { return stepLink(step.code, this.companyId); }
  isOpen(code: string): boolean { return this.expanded() === code; }
  setFilter(key: StepFilter): void { this.filter.set(key); this.page.set(0); }
  setSize(n: number): void { this.size.set(n); this.page.set(0); }
  goTo(page: number): void { this.page.set(page); }
  toggle(code: string): void { this.expanded.update((current) => (current === code ? null : code)); }

  filterClass(key: StepFilter): string {
    return this.filter() === key
      ? 'bg-slate-900 text-white border-slate-900'
      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50';
  }

  markNotApplicable(step: ImportStep): void {
    this.apply(this._api.markNotApplicable(this.companyId, step.code), 'Paso marcado como no aplica.');
  }

  unmark(step: ImportStep): void {
    this.apply(this._api.unmarkNotApplicable(this.companyId, step.code), 'Se quitó la marca de no aplica.');
  }

  private apply(request: Observable<ImportWizardOverview>, message: string): void {
    this.busy.set(true);
    request.pipe(finalize(() => this.busy.set(false)), takeUntilDestroyed(this._destroyRef)).subscribe({
      next: (overview) => { this.overview.set(overview); this._notification.success(message); },
      error: (err) => this._notification.error(err?.error?.message ?? 'No se pudo actualizar el paso.'),
    });
  }
}
