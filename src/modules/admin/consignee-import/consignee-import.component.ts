import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { concatMap, finalize, from, interval, switchMap, takeWhile, tap, toArray } from 'rxjs';
import { ConsigneeImportService } from '@core/services/consignee-import.service';
import { ConsigneeImportParserService } from '@core/services/consignee-import-parser.service';
import { NotificationService } from '@core/services/notification.service';
import { QdooraAlertService } from '@core/components/alert/alert.service';
import { ConsigneeImportSession, ParsedSigadFile } from '@core/models/consignee-import.model';
import { SharedAlertComponent } from '@shared/alert/alert.component';
import { ConsigneeImportRouteData } from './consignee-import.resolver';
import { POLL_MS, chunkRows, totalOpen } from './consignee-import.utils';
import { ImportWorkComponent } from './import-work/import-work.component';

type Stage = 'blocked' | 'upload' | 'uploading' | 'work' | 'processing' | 'closed';
const ALERT = 'consignee-import';

/** Importación masiva de consignatarios desde el listado de clientes de SIGAD (ADMIN_ROLE). */
@Component({
  selector: 'app-consignee-import',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ImportWorkComponent, SharedAlertComponent],
  host: { class: 'block h-full overflow-hidden' },
  template: `
    <div class="h-full flex flex-col bg-[#f8fafc] text-slate-800 overflow-hidden font-sans">
      <div class="bg-white border-b border-slate-200 px-8 py-3 flex justify-between items-center shrink-0 z-50 shadow-sm relative">
        <div class="flex items-center gap-5">
          <a [routerLink]="['/admin/imports', companyId]" aria-label="Volver al asistente de importaciones" class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 hover:bg-slate-100">‹</a>
          <div class="relative">
            <div class="w-1.5 h-10 bg-blue-600 rounded-full"></div>
            <div class="absolute inset-0 bg-blue-600 blur-lg opacity-20"></div>
          </div>
          <div>
            <h1 class="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">Importar consignatarios</h1>
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Empresa #{{ companyId }} · Formato SIGAD_CLIENTES_V1</p>
          </div>
        </div>
        @if (session(); as s) {
          <div class="flex items-center gap-3 text-xs">
            <span class="text-slate-500">{{ s.file_name }} · {{ s.user_name }}</span>
            @if (stage() === 'work') {
              <button (click)="execute()" [disabled]="!(s.counts.ready ?? 0) || busy()" class="px-4 py-2 rounded-xl bg-blue-600 text-white font-black uppercase disabled:opacity-40">
                Ejecutar ({{ s.counts.ready ?? 0 }})
              </button>
              <button (click)="abort()" [disabled]="busy()" class="px-4 py-2 rounded-xl border border-slate-200 font-black uppercase">Cancelar sesión</button>
            }
          </div>
        }
      </div>

      @if (stage() === 'work') {
        <app-shared-alert [name]="alertName" class="block px-8 pt-4 shrink-0 empty:hidden"></app-shared-alert>
        <app-import-work class="flex-1 min-h-0" [companyId]="companyId" [session]="session()!" (changed)="refreshSession()" />
      } @else {
      <div class="flex-1 overflow-auto p-8">
        <app-shared-alert [name]="alertName" class="mb-6 block"></app-shared-alert>

        @switch (stage()) {
          @case ('blocked') {
            <p class="text-sm text-slate-500">Resuelva los requisitos indicados arriba para habilitar la importación.</p>
          }
          @case ('upload') {
            <div class="max-w-2xl mx-auto bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center space-y-4"
                 (dragover)="$event.preventDefault()" (drop)="onDrop($event)">
              <p class="font-black uppercase text-sm">Arrastre el "Listado de clientes" de SIGAD (.xls o .xlsx)</p>
              <input type="file" accept=".xls,.xlsx" (change)="onFile($event)" class="text-xs" />
              <button type="button" (click)="downloadExample()" class="block mx-auto text-xs text-blue-600 underline">Descargar formato de ejemplo</button>
              @if (formatErrors().length) {
                <ul class="text-left text-xs text-red-600 list-disc pl-5">
                  @for (e of formatErrors(); track e) { <li>{{ e }}</li> }
                </ul>
              }
              @if (parsed(); as p) {
                <div class="text-sm bg-slate-50 rounded-xl p-4">
                  {{ p.rows.length }} filas detectadas · {{ p.inactive }} inactivas
                  <button (click)="createSession(false)" [disabled]="busy()" class="ml-4 px-4 py-2 rounded-xl bg-blue-600 text-white font-black uppercase">Crear sesión</button>
                </div>
              }
              @if (confirmReplace()) {
                <div class="text-sm bg-amber-50 border border-amber-200 rounded-xl p-4 space-x-3">
                  <span>Hay una sesión con filas trabajadas.</span>
                  <button (click)="resume()" class="px-3 py-1 rounded-lg border font-bold">Retomar</button>
                  <button (click)="createSession(true)" class="px-3 py-1 rounded-lg bg-red-600 text-white font-bold">Descartar y empezar de nuevo</button>
                </div>
              }
            </div>
          }
          @case ('uploading') {
            <p class="text-center text-sm font-bold">Enviando filas {{ sent() }} de {{ parsed()?.rows?.length }}…</p>
          }
          @case ('processing') {
            <p class="text-center text-sm font-bold">
              Importando: {{ (session()?.counts?.imported ?? 0) + (session()?.counts?.failed ?? 0) }} procesadas ·
              {{ session()?.counts?.failed ?? 0 }} fallidas. La sesión está en modo lectura.
            </p>
          }
          @case ('closed') {
            <div class="max-w-xl mx-auto bg-white rounded-2xl border p-8 space-y-3 text-sm">
              <p class="font-black uppercase">Sesión cerrada ({{ session()?.status }})</p>
              <p>Importadas: {{ session()?.counts?.imported ?? 0 }} · Omitidas: {{ session()?.counts?.skipped ?? 0 }}</p>
              <button (click)="download('original')" class="px-4 py-2 rounded-xl border font-bold">Descargar archivo original</button>
              <button (click)="download('snapshot')" [disabled]="!session()?.has_backup?.snapshot" class="ml-2 px-4 py-2 rounded-xl border font-bold">Descargar registro de la sesión</button>
              <button (click)="startOver()" class="ml-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold">Nueva importación</button>
            </div>
          }
        }
      </div>
      }
    </div>
  `,
})
export class ConsigneeImportComponent implements OnDestroy {
  private _route = inject(ActivatedRoute);
  private _api = inject(ConsigneeImportService);
  private _parser = inject(ConsigneeImportParserService);
  private _notification = inject(NotificationService);
  private _alert = inject(QdooraAlertService);
  private _destroyRef = inject(DestroyRef);

  private readonly data = this._route.snapshot.data['importData'] as ConsigneeImportRouteData;
  readonly companyId = this.data.companyId;
  readonly alertName = ALERT;

  readonly session = signal<ConsigneeImportSession | null>(this.data.session);
  readonly parsed = signal<ParsedSigadFile | null>(null);
  readonly formatErrors = signal<string[]>([]);
  readonly confirmReplace = signal(false);
  readonly busy = signal(false);
  readonly sent = signal(0);
  readonly uploading = signal(false);
  private file: File | null = null;

  readonly stage = computed<Stage>(() => {
    if (!this.data.requirements.ready) return 'blocked';
    if (this.uploading()) return 'uploading';
    const s = this.session();
    if (!s) return 'upload';
    if (s.status === 'processing') return 'processing';
    if (['completed', 'aborted', 'error'].includes(s.status)) return 'closed';
    return 'work';
  });

  constructor() {
    if (!this.data.requirements.ready) {
      this._alert.showAlert({
        appearance: 'border', type: 'error', name: ALERT,
        message: this.data.requirements.blockers.map((b) => b.message).join(' '),
      });
    }
    if (this.session()?.status === 'processing') this.poll();
  }

  ngOnDestroy(): void {
    this._alert.clearAlert(ALERT);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) void this.read(file);
  }

  onFile(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) void this.read(file);
  }

  private async read(file: File): Promise<void> {
    this.file = file;
    this.parsed.set(null);
    const result = await this._parser.parse(file);
    this.formatErrors.set(result.errors);
    if (!result.errors.length) this.parsed.set(result);
  }

  downloadExample(): void {
    const url = URL.createObjectURL(this._parser.buildExampleFile());
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formato-sigad-clientes.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  }

  createSession(replace: boolean): void {
    const parsed = this.parsed();
    if (!parsed || !this.file) return;
    this.busy.set(true);
    this.confirmReplace.set(false);
    this._api.createSession(this.companyId, this.file, parsed, replace).pipe(
      switchMap((session) => {
        this.uploading.set(true);
        this.sent.set(0);
        return from(chunkRows(parsed.rows)).pipe(
          concatMap((chunk) => this._api.addItems(this.companyId, session.id, chunk).pipe(
            tap(() => this.sent.update((n) => n + chunk.length)),
          )),
          toArray(),
          switchMap(() => this._api.activeSession(this.companyId)),
        );
      }),
      finalize(() => { this.busy.set(false); this.uploading.set(false); }),
      takeUntilDestroyed(this._destroyRef),
    ).subscribe({
      next: (session) => { this.session.set(session); this._notification.success('Filas cargadas. Revise y corrija antes de ejecutar.'); },
      error: (err) => {
        if (err?.status === 409 && !replace) { this.confirmReplace.set(true); return; }
        this._notification.error(err?.error?.message ?? 'No se pudo crear la sesión de importación.');
      },
    });
  }

  resume(): void {
    this.confirmReplace.set(false);
    this.refreshSession();
  }

  refreshSession(): void {
    this._api.activeSession(this.companyId).pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((s) => { if (s) this.session.set(s); });
  }

  execute(): void {
    const s = this.session();
    if (!s) return;
    const ready = s.counts.ready ?? 0;
    const pending = totalOpen(s.counts) - ready;
    if (!confirm(`Se importarán ${ready} filas listas. Quedan ${pending} sin procesar; podrá ejecutarlas después.`)) return;
    this.busy.set(true);
    this._api.execute(this.companyId, s.id).pipe(finalize(() => this.busy.set(false))).subscribe({
      next: () => { this.session.set({ ...s, status: 'processing' }); this.poll(); },
      error: (err) => this._notification.error(err?.error?.message ?? 'No se pudo ejecutar la importación.'),
    });
  }

  private poll(): void {
    const id = this.session()!.id;
    interval(POLL_MS).pipe(
      switchMap(() => this._api.progress(this.companyId, id)),
      takeWhile((p) => p.status === 'processing', true),
      takeUntilDestroyed(this._destroyRef),
    ).subscribe((p) => {
      this.session.update((s) => (s ? { ...s, status: p.status, counts: p.counts } : s));
      if (p.status !== 'processing') {
        this._notification.success(`Importación terminada: ${p.counts.imported ?? 0} importadas, ${p.counts.failed ?? 0} fallidas.`);
        this.afterProcessing();
      }
    });
  }

  /** Al terminar, la sesión sigue abierta (hay filas por trabajar) o quedó cerrada con su respaldo. */
  private afterProcessing(): void {
    this._api.activeSession(this.companyId).subscribe((open) => {
      if (open) {
        this.session.set(open);
      } else {
        this.session.update((s) => (s ? { ...s, has_backup: { original: true, snapshot: true } } : s));
      }
    });
  }

  abort(): void {
    const s = this.session();
    if (!s || !confirm('¿Cancelar la sesión? Lo ya importado se mantiene y queda el respaldo.')) return;
    this._api.abort(this.companyId, s.id).subscribe({
      next: () => this.session.set({ ...s, status: 'aborted', has_backup: { original: true, snapshot: true } }),
      error: (err) => this._notification.error(err?.error?.message ?? 'No se pudo cancelar la sesión.'),
    });
  }

  download(file: 'original' | 'snapshot'): void {
    const s = this.session();
    if (!s) return;
    this._api.backupUrl(this.companyId, s.id, file).subscribe({
      next: (r) => window.open(r.url, '_blank', 'noopener'),
      error: (err) => this._notification.error(err?.error?.message ?? 'No se pudo obtener el respaldo.'),
    });
  }

  startOver(): void {
    this.session.set(null);
    this.parsed.set(null);
    this.formatErrors.set([]);
  }
}
