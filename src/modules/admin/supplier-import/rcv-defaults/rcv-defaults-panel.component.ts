import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RCV_WORDING, applyLabel, defaultsStatus, isRunActive, pendingCount, runSummary } from '@core/imports/rcv-defaults.utils';
import {
  RcvApplyPreview, RcvDefaultRun, RcvDefaultsState, RcvEligibleAccount, RcvOperation, RcvValueType,
} from '@core/models/rcv-defaults.model';
import { NotificationService } from '@core/services/notification.service';
import { RcvDefaultsService } from '@core/services/rcv-defaults.service';
import { finalize, forkJoin, switchMap, takeWhile, timer } from 'rxjs';
import { paginate } from '../../import-wizard/import-wizard.utils';

/** Una cuenta se identifica por tipo e id: una cuenta y una subcuenta pueden compartir el mismo id. */
const keyOf = (type: string, id: number): string => `${type}:${id}`;
const optionLabel = (a: RcvEligibleAccount): string => `${a.code} · ${a.name}`;
const requiresExtra = (a: RcvEligibleAccount): boolean => !!a.wk_auxiliary_rut || !!a.wk_auxiliary_concept || !!a.wk_cost_center;

/**
 * Cuentas RCV por defecto de la empresa para la importación de proveedores y consignatarios: las mismas que edita el Portal
 * Cliente. Antes de importar se eligen aquí; cada proveedor importado las hereda, y después se pueden aplicar
 * a los proveedores de la empresa que sigan sin configuración.
 */
@Component({
  selector: 'app-rcv-defaults-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    <section class="shrink-0 border-b border-slate-200 bg-white px-8 py-3" aria-label="Cuentas RCV por defecto">
      <button type="button" (click)="open.set(!open())" [attr.aria-expanded]="open()" aria-controls="rcv-defaults-body"
        class="cursor-pointer flex w-full flex-wrap items-center gap-x-6 gap-y-2 text-left focus-visible:outline-2 focus-visible:outline-blue-600">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" class="h-5 w-5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 7h10M18 7h2M4 17h2M10 17h10M14 4v6M6 14v6"/></svg>
        </span>
        <span class="min-w-0">
          <span class="block text-[10px] font-black uppercase tracking-widest text-slate-500">Cuentas RCV de {{ words().operation }} por defecto</span>
          <span class="mt-0.5 block text-sm text-slate-900">
            <span class="font-semibold">Afecta:</span> {{ summary('affected') }}
            <span class="mx-2 text-slate-300" aria-hidden="true">|</span>
            <span class="font-semibold">Exenta:</span> {{ summary('exempt') }}
          </span>
        </span>
        <span class="ml-auto flex items-center gap-3">
          <span [class]="'inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ' + statusClass()">{{ statusText() }}</span>
          <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" [class]="'h-5 w-5 text-slate-500 transition-transform ' + (open() ? 'rotate-180' : '')"><path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd"/></svg>
        </span>
      </button>

      @if (open()) {
        <div id="rcv-defaults-body" class="custom-scrollbar mt-4 max-h-[40vh] space-y-4 overflow-y-auto pr-1">
          <p class="text-xs text-slate-600">
            Son las cuentas por defecto de la empresa: los {{ words().plural }} que se importen y los que se creen después
            las heredan. No se cambia la cuenta de {{ words().plural }} que ya la tienen configurada.
          </p>

          @if (loading()) {
            <div class="h-20 animate-pulse rounded-xl bg-slate-100" role="status" aria-label="Cargando cuentas por defecto"></div>
          } @else if (!ready()) {
            <p class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900" role="alert">
              Faltan cuentas maestras para operar {{ words().operation }}s: {{ missing().join(', ') }}. Asígnalas en el plan de cuentas de la empresa.
            </p>
          } @else if (accounts().length === 0) {
            <p class="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs font-semibold text-blue-900" role="status">
              La empresa no tiene cuentas marcadas como operativas de {{ words().operation }}. Configúralas en su plan de cuentas.
            </p>
          } @else {
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              @for (slot of slots; track slot.valueType) {
                <div class="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                  <label [for]="'rcv-default-' + slot.valueType" class="block text-[10px] font-black uppercase tracking-widest text-slate-500">{{ slot.label }}</label>
                  <select [id]="'rcv-default-' + slot.valueType" [formControl]="slot.control"
                    class="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600">
                    <option [ngValue]="null">Sin definir</option>
                    @for (a of accounts(); track a.type + a.account_id) {
                      <option [value]="keyOf(a)" [disabled]="needsExtra(a)">{{ label(a) }}@if (needsExtra(a)) { (exige auxiliar o centro de costo) }</option>
                    }
                  </select>
                  <div class="mt-3 flex items-center justify-end">
                    <button type="button" (click)="save(slot.valueType)" [disabled]="busy() || !canSave(slot.valueType)"
                      class="cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 rounded-xl bg-blue-600 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-blue-500 focus-visible:outline-2 focus-visible:outline-blue-800">
                      {{ saving() === slot.valueType ? 'Guardando…' : 'Guardar' }}
                    </button>
                  </div>
                </div>
              }
            </div>
            <p class="text-[11px] text-slate-500">Las cuentas que exigen auxiliar o centro de costo se configuran desde el Portal Cliente.</p>

            @if (hasDefault()) {
              <div class="rounded-xl border border-slate-200 p-3">
                <div class="flex flex-wrap items-center gap-3">
                  <button type="button" (click)="apply()" [disabled]="busy() || pending() === 0 || runActive()"
                    class="cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 rounded-xl bg-slate-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-slate-700 focus-visible:outline-2 focus-visible:outline-blue-600">
                    {{ label_apply() }}
                  </button>
                  <span class="text-[11px] text-slate-500">Solo completa a los que no tienen cuenta; no modifica a los ya configurados.</span>
                </div>

                @if (run(); as r) {
                  <div class="mt-3" aria-live="polite">
                    <div class="mb-1 flex items-center justify-between text-xs">
                      <span class="font-semibold text-slate-700">{{ statusOfRun(r) }}</span>
                      <span class="font-mono text-slate-500">{{ r.percent }}%</span>
                    </div>
                    <div class="h-2 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" [attr.aria-label]="'Avance de la aplicación a ' + words().plural"
                      aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="r.percent">
                      <div class="h-full rounded-full bg-blue-600 transition-all duration-500" [style.width.%]="r.percent"></div>
                    </div>
                    @if (!active(r)) { <p class="mt-2 text-xs text-slate-600">{{ summaryOfRun(r) }}</p> }
                  </div>

                  @if (!active(r) && r.errors.length) {
                    <div class="mt-3 flex max-h-72 flex-col overflow-hidden rounded-xl border border-slate-200">
                      <div class="min-h-0 flex-1 overflow-auto custom-scrollbar">
                        <table class="w-full text-left text-xs">
                          <caption class="sr-only">{{ words().title }}s que no pudieron configurarse</caption>
                          <thead class="sticky top-0 z-20 bg-slate-500 text-white">
                            <tr><th scope="col" class="px-4 py-2 text-[10px] font-black uppercase tracking-widest">{{ words().title }}</th><th scope="col" class="px-4 py-2 text-[10px] font-black uppercase tracking-widest">Motivo</th></tr>
                          </thead>
                          <tbody>
                            @for (e of errorPage().records; track e.auxiliary_id) {
                              <tr class="border-t border-slate-100"><td class="px-4 py-2 font-semibold text-slate-800">{{ e.auxiliary_name ?? ('#' + e.auxiliary_id) }}</td><td class="px-4 py-2 text-slate-600">{{ e.reason }}</td></tr>
                            }
                          </tbody>
                        </table>
                      </div>
                      <footer class="flex shrink-0 items-center justify-between bg-slate-500 px-4 py-2 text-white">
                        <div class="flex items-center gap-4">
                          <label for="rcv-errors-size" class="text-[9px] font-black uppercase tracking-widest opacity-60">Visualizar</label>
                          <select id="rcv-errors-size" (change)="setSize(+$any($event.target).value)"
                            class="cursor-pointer rounded-lg border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-black text-white outline-none">
                            @for (n of sizes; track n) { <option [value]="n" [selected]="size() === n" class="text-slate-800">{{ n }} REGISTROS</option> }
                          </select>
                          <span class="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">
                            PÁGINA {{ errorPage().pagination.page + 1 }} DE {{ errorPage().pagination.lastPage + 1 }} · {{ errorPage().pagination.startIndex }}–{{ errorPage().pagination.endIndex }} DE {{ errorPage().pagination.length }}
                          </span>
                        </div>
                        <div class="flex gap-3">
                          <button type="button" (click)="goTo(errorPage().pagination.page - 1)" [disabled]="errorPage().pagination.page === 0"
                            class="cursor-pointer rounded-lg border border-white/10 bg-white/5 px-4 py-1 text-[10px] font-black uppercase tracking-widest hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-30">Anterior</button>
                          <button type="button" (click)="goTo(errorPage().pagination.page + 1)" [disabled]="errorPage().pagination.page >= errorPage().pagination.lastPage"
                            class="cursor-pointer rounded-lg border border-blue-400/40 bg-blue-600 px-4 py-1 text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-30">Siguiente</button>
                        </div>
                      </footer>
                    </div>
                  }
                }
              </div>
            }
          }
        </div>
      }
    </section>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
  `],
})
export class RcvDefaultsPanelComponent implements OnInit {
  readonly companyId = input.required<number>();
  readonly operation = input<RcvOperation>('purchase');

  private readonly service = inject(RcvDefaultsService);
  private readonly notification = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly sizes = [10, 20, 50];
  protected readonly open = signal(false);
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly saving = signal<RcvValueType | null>(null);
  protected readonly state = signal<RcvDefaultsState | null>(null);
  protected readonly accounts = signal<RcvEligibleAccount[]>([]);
  protected readonly preview = signal<RcvApplyPreview | null>(null);
  protected readonly run = signal<RcvDefaultRun | null>(null);
  protected readonly size = signal(10);
  private readonly page = signal(0);

  protected readonly slots: { valueType: RcvValueType; label: string; control: FormControl<string | null> }[] = [
    { valueType: 'affected', label: 'Cuenta afecta', control: new FormControl<string | null>(null) },
    { valueType: 'exempt', label: 'Cuenta exenta', control: new FormControl<string | null>(null) },
  ];

  protected readonly ready = computed(() => this.state()?.prerequisites[this.operation()].ready ?? false);
  protected readonly missing = computed(() => this.state()?.prerequisites[this.operation()].missing ?? []);
  protected readonly config = computed(() => this.state()?.config ?? []);
  protected readonly hasDefault = computed(() => this.config().some((c) => c.purpose.startsWith(`rcv_default_${this.operation()}_`) && !c.needs_review));
  protected readonly words = computed(() => RCV_WORDING[this.operation()]);
  protected readonly pending = computed(() => pendingCount(this.preview()));
  protected readonly runActive = computed(() => { const r = this.run(); return !!r && isRunActive(r); });
  protected readonly errorPage = computed(() => paginate(this.run()?.errors ?? [], this.page(), this.size()));

  protected readonly statusText = computed(() => ({ none: 'Sin definir', partial: 'Parcial', complete: 'Completa' })[defaultsStatus(this.config(), this.operation())]);
  protected readonly statusClass = computed(() => ({
    none: 'bg-slate-100 text-slate-600', partial: 'bg-amber-100 text-amber-800', complete: 'bg-emerald-100 text-emerald-800',
  })[defaultsStatus(this.config(), this.operation())]);

  protected readonly keyOf = (a: RcvEligibleAccount): string => keyOf(a.type, a.account_id);
  protected readonly label = optionLabel;
  protected readonly needsExtra = requiresExtra;
  protected readonly active = isRunActive;

  ngOnInit(): void {
    this.load();
  }

  protected summary(valueType: RcvValueType): string {
    const cfg = this.configOf(valueType);
    if (!cfg) return 'Sin definir';
    // La cuenta mayor se muestra con el largo de una subcuenta: el código con relleno viene de la lista de cuentas
    const key = this.savedKey(valueType);
    const account = this.accounts().find((a) => this.keyOf(a) === key);
    if (account) return optionLabel(account);
    const code = cfg.sub_account_code ?? cfg.account_code;
    const name = cfg.sub_account_name ?? cfg.account_name;
    return code ? `${code} · ${name}` : 'Definida';
  }

  protected savedKey(valueType: RcvValueType): string | null {
    const cfg = this.configOf(valueType);
    if (!cfg) return null;
    return cfg.sub_account_id ? keyOf('subcuenta', cfg.sub_account_id) : keyOf('cuenta', cfg.account_id);
  }

  protected canSave(valueType: RcvValueType): boolean {
    const value = this.control(valueType).value;
    return !!value && value !== this.savedKey(valueType);
  }

  protected label_apply(): string {
    return applyLabel(this.pending(), this.operation());
  }

  protected statusOfRun(r: RcvDefaultRun): string {
    return ({ queued: 'En cola…', running: 'Aplicando cuentas…', done: 'Terminada', failed: 'No se pudo completar' })[r.status];
  }

  protected summaryOfRun(r: RcvDefaultRun): string {
    return runSummary(r);
  }

  protected save(valueType: RcvValueType): void {
    const picked = this.accounts().find((a) => this.keyOf(a) === this.control(valueType).value);
    if (!picked || requiresExtra(picked)) return;

    this.busy.set(true);
    this.saving.set(valueType);
    this.service.save(this.companyId(), this.operation(), valueType, { account_id: picked.account_id, type: picked.type }).pipe(
      finalize(() => { this.busy.set(false); this.saving.set(null); }),
    ).subscribe({
      next: () => { this.notification.success('Cuenta por defecto guardada.'); this.refreshState(); },
      error: (err) => this.notification.error(err?.error?.message ?? 'No se pudo guardar la cuenta por defecto.'),
    });
  }

  protected apply(): void {
    this.busy.set(true);
    this.service.apply(this.companyId(), this.operation()).pipe(finalize(() => this.busy.set(false))).subscribe({
      next: (runId) => this.watch(runId),
      error: (err) => this.notification.error(err?.error?.message ?? 'No se pudo iniciar la aplicación.'),
    });
  }

  protected setSize(size: number): void {
    this.size.set(size);
    this.page.set(0);
  }

  protected goTo(page: number): void {
    this.page.set(page);
  }

  private control(valueType: RcvValueType): FormControl<string | null> {
    return this.slots.find((s) => s.valueType === valueType)!.control;
  }

  private configOf(valueType: RcvValueType) {
    return this.config().find((c) => c.purpose === `rcv_default_${this.operation()}_${valueType}`);
  }

  private load(): void {
    forkJoin({
      state: this.service.state(this.companyId()),
      accounts: this.service.accounts(this.companyId(), this.operation()),
    }).pipe(finalize(() => this.loading.set(false)), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ state, accounts }) => {
        this.accounts.set(accounts);
        this.applyState(state);
      },
      error: (err) => this.notification.error(err?.error?.message ?? 'No se pudieron cargar las cuentas por defecto.'),
    });
  }

  private refreshState(): void {
    this.service.state(this.companyId()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (state) => this.applyState(state),
      error: (err) => this.notification.error(err?.error?.message ?? 'No se pudieron actualizar las cuentas por defecto.'),
    });
  }

  private applyState(state: RcvDefaultsState): void {
    this.state.set(state);
    for (const slot of this.slots) slot.control.setValue(this.savedKey(slot.valueType), { emitEvent: false });
    this.loadPreview();
  }

  private loadPreview(): void {
    if (!this.hasDefault()) { this.preview.set(null); return; }
    this.service.preview(this.companyId(), this.operation()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (p) => this.preview.set(p),
      error: () => this.preview.set(null),
    });
  }

  /** Consulta el avance cada 2 s hasta que la ejecución termina. */
  private watch(runId: number): void {
    timer(0, 2000).pipe(
      switchMap(() => this.service.run(this.companyId(), runId)),
      takeWhile((r) => isRunActive(r), true),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (r) => {
        this.run.set(r);
        this.page.set(0);
        if (!isRunActive(r)) this.loadPreview();
        if (r.status === 'done') this.notification.success(`Aplicación terminada: ${r.applied} cuentas configuradas, ${r.failed} con error.`);
        if (r.status === 'failed') this.notification.error('La aplicación no se pudo completar.');
      },
      error: (err) => this.notification.error(err?.error?.message ?? 'No se pudo consultar el avance.'),
    });
  }
}
