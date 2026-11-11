import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable, finalize } from 'rxjs';
import { ImportWizardService } from '@core/services/import-wizard.service';
import { NotificationService } from '@core/services/notification.service';
import { QdooraAlertService } from '@core/components/alert/alert.service';
import { ImportStep, ImportStepStatus, ImportWizardOverview } from '@core/models/import-wizard.model';
import { SharedAlertComponent } from '@shared/alert/alert.component';
import { ImportWizardRouteData } from './import-wizard.resolver';
import { openLabel, progressPercent, statusClass, statusLabel, stepLink } from './import-wizard.utils';

const ALERT = 'import-wizard';

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
        @if (overview(); as o) {
          <div class="flex flex-col items-end gap-1.5 w-56">
            <span class="text-sm font-black text-slate-900">{{ o.progress.completed }} de {{ o.progress.total }}</span>
            <div class="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden" role="progressbar" aria-label="Avance de importaciones"
              aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="percent()">
              <div class="h-full bg-blue-600 transition-all duration-500" [style.width.%]="percent()"></div>
            </div>
            <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pasos resueltos</span>
          </div>
        }
      </div>

      <div class="flex-1 overflow-auto p-8">
        <app-shared-alert [name]="alertName" class="mb-6 block"></app-shared-alert>

        @if (overview(); as o) {
          <ol class="max-w-3xl mx-auto space-y-4">
            @for (step of o.steps; track step.code) {
              <li class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex gap-4 items-start">
                <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white text-sm font-black" aria-hidden="true">{{ step.order }}</span>
                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-3">
                    <h2 class="text-sm font-black uppercase text-slate-900">{{ step.title }}</h2>
                    <span class="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border" [class]="chip(step.status)">{{ label(step.status) }}</span>
                  </div>
                  <p class="mt-1 text-xs text-slate-500">{{ step.description }}</p>

                  @if (step.summary; as s) {
                    <p class="mt-2 text-[10px] font-bold text-slate-500">
                      {{ s.imported }} importadas · {{ s.failed }} fallidas en la última ejecución
                      @if (s.last_at) { · {{ s.last_at | date: 'dd/MM/yyyy HH:mm' }} }
                    </p>
                  }
                  @if (step.blocked) {
                    <p class="mt-2 text-[10px] font-black text-amber-700">{{ step.blocked_reason }}</p>
                  }

                  <div class="mt-3 flex flex-wrap items-center gap-3">
                    @if (link(step); as l) {
                      @if (step.blocked) {
                        <span class="px-4 py-2 rounded-xl bg-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-widest cursor-not-allowed" aria-disabled="true">{{ openText(step.status) }}</span>
                      } @else {
                        <a [routerLink]="l" class="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">{{ openText(step.status) }}</a>
                      }
                    }
                    @if (step.status === 'pending') {
                      <button type="button" (click)="markNotApplicable(step)" [disabled]="busy()"
                        class="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 hover:underline cursor-pointer disabled:opacity-40">Marcar como no aplica</button>
                    } @else if (step.status === 'not_applicable') {
                      <button type="button" (click)="unmark(step)" [disabled]="busy()"
                        class="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-800 hover:underline cursor-pointer disabled:opacity-40">Deshacer</button>
                    }
                  </div>
                </div>
              </li>
            }
          </ol>
        }
      </div>
    </div>
  `,
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

  label(status: ImportStepStatus): string { return statusLabel(status); }
  chip(status: ImportStepStatus): string { return statusClass(status); }
  openText(status: ImportStepStatus): string { return openLabel(status); }
  link(step: ImportStep): (string | number)[] | null { return stepLink(step.code, this.companyId); }

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
