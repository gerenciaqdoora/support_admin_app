import { ConfirmService } from '../../shared/confirm-dialog/confirm.service';
import { ChangeDetectionStrategy, Component, DestroyRef, OnDestroy, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { concatMap, finalize, from, interval, switchMap, takeWhile, tap, toArray } from 'rxjs';
import { ImportKind } from '@core/imports/import-kind';
import { NotificationService } from '@core/services/notification.service';
import { QdooraAlertService } from '@core/components/alert/alert.service';
import { ConsigneeImportSession, ParsedSigadFile } from '@core/models/consignee-import.model';
import { MasterAccountSummary } from '@core/models/supplier-import.model';
import { accountWarning } from './account-warning';
import { MasterAccountBarComponent } from './master-account-bar/master-account-bar.component';
import { SharedAlertComponent } from '@shared/alert/alert.component';
import { FileDropzoneComponent } from '@shared/file-dropzone/file-dropzone.component';
import { ConsigneeImportRouteData } from './consignee-import.resolver';
import { POLL_MS, chunkRows, totalOpen } from './consignee-import.utils';
import { ImportWorkComponent } from './import-work/import-work.component';

type Stage = 'blocked' | 'upload' | 'uploading' | 'work' | 'processing' | 'closed';

/** Pantalla de una importación masiva desde SIGAD (ADMIN_ROLE): su `ImportKind` viene en los datos de la ruta. */
@Component({
  selector: 'app-consignee-import',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, ImportWorkComponent, SharedAlertComponent, FileDropzoneComponent, MasterAccountBarComponent],
  host: { class: 'block h-full overflow-hidden' },
  template: `
    <div class="h-full flex flex-col bg-[#f8fafc] text-slate-800 overflow-hidden font-sans">
      <div class="bg-white border-b border-slate-200 px-8 py-3 flex justify-between items-center shrink-0 z-50 shadow-sm relative">
        <div class="flex items-center gap-5">
          <a [routerLink]="['/admin/imports', companyId]" aria-label="Volver al asistente de importaciones" class="cursor-pointer w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 hover:bg-slate-100">‹</a>
          <div class="relative">
            <div class="w-1.5 h-10 bg-blue-600 rounded-full"></div>
            <div class="absolute inset-0 bg-blue-600 blur-lg opacity-20"></div>
          </div>
          <div>
            <h1 class="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">{{ kind.title }}</h1>
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">Empresa #{{ companyId }} · {{ kind.formatLabel }}</p>
          </div>
        </div>
        @if (session(); as s) {
          <div class="flex items-center gap-3 text-xs">
            <div class="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-xl border border-slate-200 bg-slate-50 max-w-sm">
              <span aria-hidden="true" class="w-8 h-8 shrink-0 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-black">XLS</span>
              <div class="min-w-0">
                <p class="font-bold text-slate-800 truncate" [title]="s.file_name">{{ s.file_name }}</p>
                <p class="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate">Cargado por {{ s.user_name }}</p>
              </div>
              <button type="button" (click)="download('original')" [disabled]="!s.has_backup.original"
                [attr.aria-label]="'Descargar archivo original ' + s.file_name" title="Descargar archivo original"
                class="cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 w-8 h-8 shrink-0 rounded-lg border border-slate-200 bg-white text-slate-500 flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 focus-visible:outline-2 focus-visible:outline-blue-600">
                <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4"><path d="M10 3a1 1 0 0 1 1 1v6.586l1.793-1.793a1 1 0 1 1 1.414 1.414l-3.5 3.5a1 1 0 0 1-1.414 0l-3.5-3.5a1 1 0 1 1 1.414-1.414L9 10.586V4a1 1 0 0 1 1-1Z"/><path d="M4 14a1 1 0 0 1 1 1v1h10v-1a1 1 0 1 1 2 0v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a1 1 0 0 1 1-1Z"/></svg>
              </button>
            </div>
            @if (stage() === 'work') {
              <button (click)="execute()" [disabled]="!(s.counts.ready ?? 0) || busy() || !!warning()" [attr.title]="warning() ? 'Resuelva la diferencia de cuenta maestra para ejecutar' : null" class="cursor-pointer disabled:cursor-not-allowed px-4 py-2 rounded-xl bg-blue-600 text-white font-black uppercase disabled:opacity-40">
                Ejecutar ({{ s.counts.ready ?? 0 }})
              </button>
              <button (click)="abort()" [disabled]="busy()" class="cursor-pointer disabled:cursor-not-allowed px-4 py-2 rounded-xl border border-slate-200 font-black uppercase">Cancelar sesión</button>
            }
          </div>
        }
      </div>

      @if (kind.masterAccountLabel && (stage() === 'work' || stage() === 'upload' || stage() === 'blocked')) {
        <app-master-account-bar [label]="kind.masterName ?? ''" [master]="master()" [check]="session()?.account_check" [warning]="stage() === 'work' ? warning() : null"
          [busy]="busy()" (reassign)="reassignMaster()" />
      }

      @if (busyLabel(); as label) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-sm" role="status" aria-live="polite">
          <div class="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-4 shadow-lg">
            <span class="h-6 w-6 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" aria-hidden="true"></span>
            <p class="text-sm font-black uppercase tracking-wide text-slate-800">{{ label }}</p>
          </div>
        </div>
      }

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
            <div class="max-w-2xl mx-auto space-y-4">
              <app-file-dropzone
                [title]="kind.uploadTitle"
                [accept]="kind.uploadAccept"
                [templateText]="kind.templateLinkText"
                [fileName]="file?.name ?? null"
                [errors]="formatErrors()"
                (fileSelected)="read($event)"
                (template)="downloadExample()" />
              @if (parsed(); as p) {
                <div class="text-sm bg-slate-50 rounded-xl p-4">
                  {{ p.rows.length }} filas detectadas@if (p.inactive) { · {{ p.inactive }} inactivas }
                  <button (click)="createSession(false)" [disabled]="busy()" class="ml-4 cursor-pointer px-4 py-2 rounded-xl bg-blue-600 text-white font-black uppercase">Crear sesión</button>
                </div>
              }
              @if (confirmReplace()) {
                <div class="text-sm bg-amber-50 border border-amber-200 rounded-xl p-4 space-x-3">
                  <span>Hay una sesión con filas trabajadas.</span>
                  <button (click)="resume()" class="cursor-pointer disabled:cursor-not-allowed px-3 py-1 rounded-lg border font-bold">Retomar</button>
                  <button (click)="createSession(true)" class="cursor-pointer disabled:cursor-not-allowed px-3 py-1 rounded-lg bg-red-600 text-white font-bold">Descartar y empezar de nuevo</button>
                </div>
              }
            </div>
          }
          @case ('uploading') {
            <div class="max-w-2xl mx-auto flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-10 text-center" role="status" aria-live="polite">
              <span class="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" aria-hidden="true"></span>
              <p class="text-sm font-black uppercase tracking-wide text-slate-800">
                @if (sent() === 0) { Creando la sesión… } @else { Enviando filas {{ sent() }} de {{ parsed()?.rows?.length }}… }
              </p>
              <div class="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
                <div class="h-full rounded-full bg-blue-600 transition-all duration-300" [style.width.%]="progress()"></div>
              </div>
            </div>
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
              <button (click)="download('original')" class="cursor-pointer disabled:cursor-not-allowed px-4 py-2 rounded-xl border font-bold">Descargar archivo original</button>
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
  /** Qué importación es (consignatarios, proveedores…): textos, API, lector de archivo y alerta. */
  readonly kind = this._route.snapshot.data['kind'] as ImportKind;
  private _api = inject(this.kind.api);
  private _parser = inject(this.kind.parser);
  private _notification = inject(NotificationService);
  private _confirm = inject(ConfirmService);
  private _alert = inject(QdooraAlertService);
  private _destroyRef = inject(DestroyRef);

  private readonly data = this._route.snapshot.data['importData'] as ConsigneeImportRouteData;
  readonly companyId = this.data.companyId;
  readonly alertName = this.kind.alertName;

  readonly session = signal<ConsigneeImportSession | null>(this.data.session);
  readonly parsed = signal<ParsedSigadFile | null>(null);
  readonly formatErrors = signal<string[]>([]);
  readonly confirmReplace = signal(false);
  readonly busy = signal(false);
  /** Texto del loader a pantalla completa mientras corre una acción corta (p. ej. cancelar). */
  readonly busyLabel = signal<string | null>(null);
  readonly sent = signal(0);
  readonly progress = computed(() => {
    const total = this.parsed()?.rows.length ?? 0;
    return total ? Math.min(100, Math.round((this.sent() / total) * 100)) : 0;
  });
  readonly uploading = signal(false);
  protected file: File | null = null;

  /** Cuenta maestra vigente: la de la sesión si existe; antes de subir el archivo, la de los requisitos. */
  readonly master = computed<MasterAccountSummary | null>(() => {
    const fromSession = this.session()?.account_check?.master;
    if (fromSession !== undefined) return fromSession;
    return this.data.requirements.role_account ?? null;
  });
  /** Aviso cuando la cuenta maestra no calza con la cuenta mayor del archivo (solo importaciones que lo declaran). */
  readonly warning = computed(() => (this.kind.masterAccountLabel ? accountWarning(this.session()?.account_check, this.kind.masterName ?? '') : null));

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
        appearance: 'border', type: 'error', name: this.alertName,
        message: this.data.requirements.blockers.map((b) => b.message).join(' '),
      });
    }
    if (this.session()?.status === 'processing') this.poll();
  }

  ngOnDestroy(): void {
    this._alert.clearAlert(this.alertName);
  }

  async read(file: File): Promise<void> {
    this.file = file;
    this.parsed.set(null);
    const result = await this._parser.parse(file);
    this.formatErrors.set(result.errors);
    if (!result.errors.length) this.parsed.set(result);
  }

  downloadExample(): void {
    const url = URL.createObjectURL(this._parser.buildTemplateFile());
    const a = document.createElement('a');
    a.href = url;
    a.download = this.kind.templateFileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  createSession(replace: boolean): void {
    const parsed = this.parsed();
    if (!parsed || !this.file || this.busy()) return;
    // Loader inmediato: la creación (subida del original a S3) tarda y evita clics repetidos.
    this.busy.set(true);
    this.uploading.set(true);
    this.sent.set(0);
    this.confirmReplace.set(false);
    this._api.createSession(this.companyId, this.file, parsed, replace).pipe(
      switchMap((session) => {
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
    this._confirm.confirm({
      title: '¿Ejecutar la importación?',
      message: pending > 0
        ? `Se importarán ${ready} filas listas. Quedan ${pending} sin procesar; podrá ejecutarlas después.`
        : `Se importarán ${ready} filas listas.`,
      warning: this.kind.executeWarning,
      confirmText: 'Ejecutar',
      tone: 'primary',
    }).subscribe((ok) => {
      if (!ok) return;
      this.busy.set(true);
      this._api.execute(this.companyId, s.id).pipe(finalize(() => this.busy.set(false))).subscribe({
        next: () => { this.session.set({ ...s, status: 'processing' }); this.poll(); },
        error: (err) => this._notification.error(err?.error?.message ?? 'No se pudo ejecutar la importación.'),
      });
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

  /** Reasigna la cuenta maestra a la cuenta mayor del archivo, con el popup estándar (cambia configuración contable). */
  reassignMaster(): void {
    const s = this.session();
    const check = s?.account_check;
    if (!s || !check?.target) return;
    const affected = check.impact.members_on_current_master;
    this._confirm.confirm({
      title: '¿Reasignar la cuenta maestra?',
      message: `La cuenta maestra ${this.kind.masterName} pasará a ${check.target.code} (${check.target.name}).`
        + (affected > 0 ? ` ${affected} auxiliares con la cuenta actual dejarán de contar como ${this.kind.memberLabelPlural} hasta recibir la nueva; los que están en el archivo la reciben al importarse.` : ''),
      warning: 'Cambia la configuración contable de la empresa',
      confirmText: 'Reasignar',
    }).subscribe((ok) => {
      if (!ok) return;
      this.busy.set(true);
      this._api.reassignMasterAccount(this.companyId, s.id).pipe(finalize(() => this.busy.set(false))).subscribe({
        next: (session) => { this.session.set(session); this._notification.success('Cuenta maestra reasignada.'); },
        error: (err) => this._notification.error(err?.error?.message ?? 'No se pudo reasignar la cuenta maestra.'),
      });
    });
  }

  abort(): void {
    const s = this.session();
    if (!s) return;
    this._confirm.confirm({
      title: '¿Cancelar la sesión?',
      message: 'Lo ya importado se mantiene y queda el respaldo del archivo y del registro de la sesión.',
      warning: 'Las filas pendientes no se importarán',
      confirmText: 'Cancelar sesión',
      cancelText: 'Volver',
    }).subscribe((ok) => {
      if (!ok) return;
      this.busy.set(true);
      this.busyLabel.set('Cancelando la sesión…');
      this._api.abort(this.companyId, s.id).pipe(finalize(() => { this.busy.set(false); this.busyLabel.set(null); })).subscribe({
        next: () => this.session.set({ ...s, status: 'aborted', has_backup: { original: true, snapshot: true } }),
        error: (err) => this._notification.error(err?.error?.message ?? 'No se pudo cancelar la sesión.'),
      });
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
