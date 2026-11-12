import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { ImportItemStatus } from '@core/models/consignee-import.model';
import { RunBase, STALL_MS, formatElapsed, isStalled, runProgress } from '../consignee-import.utils';

/** Circunferencia del anillo (radio 70): 2·π·70. */
const RING = 439.82;

/** Panel de avance de una importación en ejecución: anillo, barra, contadores, tiempo y resultado final. */
@Component({
  selector: 'app-import-progress-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto flex max-w-xl flex-col items-center gap-5 rounded-2xl border-2 bg-white p-8 text-center shadow-sm transition-colors duration-500"
      [class]="frame()" aria-labelledby="run-title">
      <div class="relative h-36 w-36 sm:h-40 sm:w-40" role="progressbar" aria-label="Avance de la importación"
        aria-valuemin="0" aria-valuemax="100" [attr.aria-valuenow]="stats().percent">
        <svg viewBox="0 0 160 160" class="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="80" cy="80" r="70" fill="none" stroke-width="12" class="stroke-slate-100"></circle>
          <circle cx="80" cy="80" r="70" fill="none" stroke-width="12" stroke-linecap="round"
            [class]="arcClass()" [attr.stroke-dasharray]="ring" [attr.stroke-dashoffset]="offset()"
            style="transition: stroke-dashoffset 600ms ease, stroke 400ms ease"></circle>
          @if (phase() === 'running') {
            <circle cx="80" cy="80" r="70" fill="none" stroke-width="12" stroke-linecap="round"
              class="ring-orbit stroke-blue-300/80" stroke-dasharray="44 396"></circle>
          }
        </svg>
        <div class="absolute inset-0 flex items-center justify-center">
          @if (phase() === 'done') {
            <svg viewBox="0 0 52 52" class="h-16 w-16" [class]="checkClass()" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">
              <path class="check-draw" d="M14 27l8 8 16-17"></path>
            </svg>
          } @else {
            <span class="text-4xl font-black tabular-nums text-slate-900">{{ stats().percent }}<span class="text-lg text-slate-400">%</span></span>
          }
        </div>
      </div>

      <div>
        <h2 id="run-title" class="text-sm font-black uppercase tracking-wide text-slate-900">
          @if (phase() === 'running') {
            Importando {{ pluralLabel() }}<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span>
          } @else {
            Importación terminada
          }
        </h2>
        <p class="mt-1 text-xs font-bold text-slate-500">{{ stats().done }} de {{ stats().total }} filas procesadas</p>
      </div>

      <div class="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div class="bar h-full rounded-full transition-all duration-500" [class]="barClass()" [style.width.%]="stats().percent"></div>
      </div>

      <dl class="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
        <div class="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
          <dt class="text-[9px] font-black uppercase tracking-widest text-emerald-700">Importadas</dt>
          <dd class="text-2xl font-black tabular-nums text-emerald-800">{{ stats().imported }}</dd>
        </div>
        <div class="rounded-xl border px-3 py-2" [class]="failedClass()">
          <dt class="text-[9px] font-black uppercase tracking-widest">Fallidas</dt>
          <dd class="text-2xl font-black tabular-nums">{{ stats().failed }}</dd>
        </div>
        <div class="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <dt class="text-[9px] font-black uppercase tracking-widest text-slate-500">Restantes</dt>
          <dd class="text-2xl font-black tabular-nums text-slate-700">{{ stats().remaining }}</dd>
        </div>
      </dl>

      <p class="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Tiempo {{ elapsed() }}</p>

      @if (phase() === 'running') {
        <p class="text-xs font-bold text-slate-500">No cierre esta pestaña. La importación continúa en el servidor aunque la recargue.</p>
        @if (stalled()) {
          <p class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-slate-600" role="status">Sigue en proceso; si no avanza, avise a TI.</p>
        }
      } @else {
        @if (stats().failed > 0) {
          <p class="text-xs font-black text-amber-700">Hubo filas fallidas. Revise las filas fallidas en la lista.</p>
        }
        <button type="button" (click)="continued.emit()"
          class="cursor-pointer rounded-xl bg-blue-600 px-8 py-2.5 text-[10px] font-black uppercase tracking-widest text-white transition-all hover:bg-blue-500 active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Continuar</button>
      }

      <p class="sr-only" aria-live="polite">{{ announce() }}</p>
    </section>
  `,
  styles: [`
    .ring-orbit { transform-origin: 80px 80px; animation: ring-orbit 1.8s linear infinite; }
    .bar-run { background-image: repeating-linear-gradient(45deg, rgba(255,255,255,.25) 0 10px, transparent 10px 20px); background-size: 28px 28px; animation: stripes 900ms linear infinite; }
    .dots i { font-style: normal; animation: dot 1.2s infinite; opacity: .2; }
    .dots i:nth-child(2) { animation-delay: .2s; }
    .dots i:nth-child(3) { animation-delay: .4s; }
    .check-draw { stroke-dasharray: 48; stroke-dashoffset: 48; animation: draw 500ms ease-out 100ms forwards; }
    @keyframes ring-orbit { to { transform: rotate(360deg); } }
    @keyframes stripes { to { background-position: 28px 0; } }
    @keyframes dot { 0%, 80%, 100% { opacity: .2; } 40% { opacity: 1; } }
    @keyframes draw { to { stroke-dashoffset: 0; } }
    @media (prefers-reduced-motion: reduce) {
      .ring-orbit, .bar-run, .dots i { animation: none; }
      .dots i { opacity: 1; }
      .check-draw { animation: none; stroke-dashoffset: 0; }
    }
  `],
})
export class ImportProgressPanelComponent {
  readonly counts = input.required<Partial<Record<ImportItemStatus, number>>>();
  /** Filas ya cerradas al empezar esta ejecución (se descuentan del avance). */
  readonly base = input.required<RunBase>();
  readonly startedAt = input.required<number>();
  readonly finishedAt = input<number | null>(null);
  readonly phase = input.required<'running' | 'done'>();
  readonly pluralLabel = input('filas');
  readonly continued = output<void>();

  protected readonly ring = RING;
  private readonly now = signal(Date.now());
  private readonly lastChangeAt = signal(Date.now());
  private lastDone = -1;

  readonly stats = computed(() => runProgress(this.counts(), this.base()));
  readonly offset = computed(() => RING * (1 - this.stats().percent / 100));
  readonly elapsed = computed(() => formatElapsed((this.finishedAt() ?? this.now()) - this.startedAt()));
  readonly stalled = computed(() => this.phase() === 'running' && isStalled(this.lastChangeAt(), this.now(), STALL_MS));
  readonly announce = computed(() => this.phase() === 'done'
    ? `Importación terminada: ${this.stats().imported} importadas, ${this.stats().failed} fallidas.`
    : `Importación al ${Math.floor(this.stats().percent / 10) * 10} %`);

  readonly frame = computed(() => {
    if (this.phase() === 'running') return 'border-slate-200';
    return this.stats().failed > 0 ? 'border-amber-300' : 'border-emerald-300';
  });
  readonly arcClass = computed(() => (this.phase() === 'done' && this.stats().failed > 0 ? 'stroke-amber-500' : this.phase() === 'done' ? 'stroke-emerald-500' : 'stroke-blue-600'));
  readonly checkClass = computed(() => (this.stats().failed > 0 ? 'text-amber-500' : 'text-emerald-500'));
  readonly barClass = computed(() => (this.phase() === 'running' ? 'bg-blue-600 bar-run' : this.stats().failed > 0 ? 'bg-amber-500' : 'bg-emerald-500'));
  readonly failedClass = computed(() => (this.stats().failed > 0 ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-slate-200 bg-slate-50 text-slate-500'));

  constructor() {
    const timer = setInterval(() => this.now.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));

    // Si las filas procesadas no cambian, el reloj de "estancado" no se reinicia.
    effect(() => {
      const done = this.stats().done;
      untracked(() => {
        if (done !== this.lastDone) {
          this.lastDone = done;
          this.lastChangeAt.set(Date.now());
        }
      });
    });
  }
}
