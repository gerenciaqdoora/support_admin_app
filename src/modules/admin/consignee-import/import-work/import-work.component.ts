import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, expand, reduce } from 'rxjs';
import { ConsigneeImportService } from '@core/services/consignee-import.service';
import { NotificationService } from '@core/services/notification.service';
import { ISSUE_LABELS } from '@core/imports/sigad-clientes-v1';
import { ConsigneeImportItem, ConsigneeImportSession, ImportItemStatus, Pagination } from '@core/models/consignee-import.model';
import { statusLabel } from '../consignee-import.utils';
import { MatDialog } from '@angular/material/dialog';
import { ImportItemDialogData, ImportItemPanelComponent } from '../import-item-panel/import-item-panel.component';

const STATUSES: ImportItemStatus[] = ['ready', 'pending', 'edited', 'skipped', 'imported', 'failed'];

@Component({
  selector: 'app-import-work',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col min-h-0 overflow-hidden' },
  template: `
    <!-- Barra de filtros (mismo patrón que Logs TI) -->
    <div class="bg-white border-b border-slate-200 px-8 py-3 flex flex-col gap-3 shrink-0 shadow-sm relative z-30">
      <div class="flex flex-wrap gap-2 items-center">
        <button type="button" (click)="setStatus(null)"
          class="px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer active:scale-95 shadow-sm"
          [class]="!status() ? 'bg-blue-600 text-white border-blue-500' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'">Todas</button>
        @for (s of statuses; track s) {
          <button type="button" (click)="setStatus(s)"
            class="px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer active:scale-95 shadow-sm"
            [class]="status() === s ? 'bg-blue-600 text-white border-blue-500' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'">
            {{ label(s) }} ({{ session().counts[s] ?? 0 }})
          </button>
        }
      </div>
      <div class="flex flex-wrap gap-4 items-end">
        <div class="flex flex-col gap-1.5 w-72">
          <label for="issue-filter" class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Problema</label>
          <select id="issue-filter" (change)="setIssue($any($event.target).value)"
            class="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-[10px] font-black text-slate-700 min-h-[44px] outline-none cursor-pointer hover:bg-white hover:border-blue-500 transition-all">
            <option value="">Todos los problemas</option>
            @for (code of issueCodes(); track code) {
              <option [value]="code" [selected]="issue() === code">{{ issueLabel(code) }} ({{ session().issues[code] }})</option>
            }
          </select>
        </div>
        <div class="flex flex-col gap-1.5 flex-1 min-w-[240px] max-w-md">
          <label for="search-filter" class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Buscar por RUT o nombre</label>
          <input id="search-filter" (input)="setSearch($any($event.target).value)" placeholder="Buscar..."
            class="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-[11px] font-black text-slate-700 min-h-[44px] outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all" />
        </div>
        @if (issue() === 'BROKEN_CHARACTERS' && rows().length) {
          <button type="button" (click)="bulkVerify()"
            class="px-4 py-2.5 min-h-[44px] rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer">
            Verificar todas las filas de este filtro ({{ pagination()?.length ?? 0 }})
          </button>
        }
      </div>
    </div>

    <!-- Tabla: cabecera fija, scroll en el cuerpo, footer con paginación -->
    <div class="flex-1 min-h-0 overflow-hidden flex flex-col relative bg-white">
      @if (loading()) {
        <div class="absolute inset-0 bg-white/60 backdrop-blur-md z-40 flex items-center justify-center" role="status">
          <div class="flex flex-col items-center gap-4">
            <div class="w-12 h-12 border-[5px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span class="text-[11px] font-black text-blue-600 uppercase tracking-[0.4em]">Cargando filas</span>
          </div>
        </div>
      }

      <div class="flex-1 overflow-auto custom-scrollbar relative min-h-0">
        <table class="w-full text-left text-xs border-separate border-spacing-0 min-w-[1000px]">
          <thead class="sticky top-0 z-20">
            <tr class="bg-slate-500 text-white shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
              <th class="px-6 py-2 font-black uppercase tracking-widest text-[8px] border-r border-white/5 w-20">Fila</th>
              <th class="px-6 py-2 font-black uppercase tracking-widest text-[8px] border-r border-white/5 w-44">Estado</th>
              <th class="px-6 py-2 font-black uppercase tracking-widest text-[8px] border-r border-white/5">Nombre</th>
              <th class="px-6 py-2 font-black uppercase tracking-widest text-[8px] border-r border-white/5 w-40">Comuna</th>
              <th class="px-6 py-2 font-black uppercase tracking-widest text-[8px] border-r border-white/5 w-16">Rep.</th>
              <th class="px-6 py-2 font-black uppercase tracking-widest text-[8px]">Problemas</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            @for (item of rows(); track item.id) {
              <tr (click)="openItem(item)"
                class="hover:bg-slate-50/80 cursor-pointer transition-all border-l-[6px] border-transparent hover:border-blue-600 active:bg-blue-50"
                [class.bg-blue-50]="selected()?.id === item.id">
                <td class="px-6 py-1.5 text-slate-500 font-bold text-[10px]">{{ item.row_number }}</td>
                <td class="px-6 py-1.5">
                  <span class="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border"
                    [class]="statusClass(item.status)">{{ label(item.status) }}</span>
                </td>
                <td class="px-6 py-1.5 font-bold text-slate-800 text-[11px] max-w-xs truncate">{{ item.normalized.name }}</td>
                <td class="px-6 py-1.5 text-slate-500 font-bold text-[10px]">{{ item.original['H'] }}</td>
                <td class="px-6 py-1.5 text-slate-500 font-bold text-[10px]">{{ item.normalized.legal_representatives.length }}</td>
                <td class="px-6 py-1.5 text-red-700 font-bold text-[10px]">{{ problems(item) }}</td>
              </tr>
            } @empty {
              <tr><td colspan="6" class="p-10 text-center text-[11px] font-black uppercase tracking-widest text-slate-400">No hay filas con este filtro.</td></tr>
            }
          </tbody>
        </table>
      </div>

      <footer class="bg-slate-500 border-t border-white/10 px-8 py-3 flex justify-between items-center shrink-0 z-30 shadow-[0_-15px_40px_rgba(0,0,0,0.15)]">
        <div class="flex items-center gap-8 text-white">
          <div class="flex items-center gap-4">
            <label for="page-size" class="text-[9px] font-black uppercase tracking-widest opacity-60">Visualizar</label>
            <select id="page-size" (change)="setSize(+$any($event.target).value)"
              class="bg-white/10 border border-white/20 text-white rounded-xl px-4 py-1.5 text-[10px] font-black outline-none cursor-pointer hover:bg-white/20 transition-all">
              @for (n of sizes; track n) {
                <option [value]="n" [selected]="size() === n" class="text-slate-800">{{ n }} REGISTROS</option>
              }
            </select>
          </div>
          <div class="h-6 w-px bg-white/10"></div>
          @if (pagination(); as p) {
            <span class="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">
              PÁGINA {{ p.page + 1 }} DE {{ p.lastPage + 1 }} · {{ p.startIndex }}–{{ p.endIndex }} DE {{ p.length }}
            </span>
          }
        </div>
        <div class="flex gap-4">
          <button type="button" (click)="goTo((pagination()?.page ?? 0) - 1)" [disabled]="(pagination()?.page ?? 0) === 0 || loading()"
            class="px-6 py-2 bg-white/5 hover:bg-white/15 text-white rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95">
            Anterior
          </button>
          <button type="button" (click)="goTo((pagination()?.page ?? 0) + 1)" [disabled]="(pagination()?.page ?? 0) >= (pagination()?.lastPage ?? 0) || loading()"
            class="px-8 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl border border-blue-400/40 text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-blue-950/30 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95">
            Siguiente
          </button>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    :host { display: flex; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #f8fafc; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
  `],
})
export class ImportWorkComponent {
  readonly companyId = input.required<number>();
  readonly session = input.required<ConsigneeImportSession>();
  readonly changed = output<void>();

  private _api = inject(ConsigneeImportService);
  private _notification = inject(NotificationService);
  private _destroyRef = inject(DestroyRef);
  private _dialog = inject(MatDialog);

  readonly statuses = STATUSES;
  readonly status = signal<ImportItemStatus | null>(null);
  readonly issue = signal<string | null>(null);
  readonly search = signal('');
  readonly page = signal(0);
  readonly size = signal(50);
  readonly sizes = [10, 20, 50, 100];
  readonly loading = signal(false);
  readonly rows = signal<ConsigneeImportItem[]>([]);
  readonly pagination = signal<Pagination | null>(null);
  readonly selected = signal<ConsigneeImportItem | null>(null);

  /** Descarta respuestas de peticiones anteriores si el usuario ya cambió el filtro. */
  private _seq = 0;

  constructor() {
    effect(() => {
      this.status(); this.issue(); this.search(); this.page(); this.size(); this.session();
      this.load();
    });
  }

  issueCodes(): string[] { return Object.keys(this.session().issues ?? {}); }
  label(s: ImportItemStatus): string { return statusLabel(s); }
  issueLabel(code: string): string { return ISSUE_LABELS[code] ?? code; }
  problems(item: ConsigneeImportItem): string {
    return [...item.errors.map((e) => e.code), ...item.warnings.filter((w) => !w.verified).map((w) => w.code)]
      .map((c) => this.issueLabel(c)).join(' · ') || (item.failure_message ?? '');
  }

  setStatus(s: ImportItemStatus | null): void { this.status.set(s); this.page.set(0); }
  setIssue(code: string): void { this.issue.set(code || null); this.page.set(0); }
  setSearch(text: string): void { this.search.set(text.trim()); this.page.set(0); }
  goTo(page: number): void { this.page.set(page); }
  setSize(n: number): void { this.size.set(n); this.page.set(0); }
  statusClass(s: ImportItemStatus): string {
    return {
      ready: 'bg-emerald-50 text-emerald-700 border-emerald-100', pending: 'bg-slate-50 text-slate-600 border-slate-200',
      edited: 'bg-blue-50 text-blue-700 border-blue-100', skipped: 'bg-slate-100 text-slate-500 border-slate-200',
      imported: 'bg-green-50 text-green-700 border-green-100', failed: 'bg-red-50 text-red-700 border-red-100',
    }[s] ?? 'bg-slate-50 text-slate-600 border-slate-200';
  }

  load(): void {
    const seq = ++this._seq;
    this.loading.set(true);
    this._api.listItems(this.companyId(), this.session().id, {
      status: this.status(), issue: this.issue(), search: this.search() || null, page: this.page(), size: this.size(),
    }).pipe(takeUntilDestroyed(this._destroyRef)).subscribe({
      next: (r) => {
        if (seq !== this._seq) return;
        this.loading.set(false);
        this.rows.set(r.records);
        this.pagination.set(r.pagination);
      },
      error: () => { if (seq === this._seq) this.loading.set(false); this._notification.error('No se pudieron cargar las filas.'); },
    });
  }

  /** Recorre todas las páginas del filtro vigente (no solo la visible) para verificar en bloque. */
  bulkVerify(): void {
    const fetchPage = (page: number) => this._api.listItems(this.companyId(), this.session().id, {
      status: this.status(), issue: this.issue(), search: this.search() || null, page, size: 100,
    });

    fetchPage(0).pipe(
      expand((r) => (r.pagination.page < r.pagination.lastPage ? fetchPage(r.pagination.page + 1) : EMPTY)),
      reduce((all, r) => all.concat(r.records), [] as ConsigneeImportItem[]),
      takeUntilDestroyed(this._destroyRef),
    ).subscribe({
      next: (items) => this.confirmBulk(items),
      error: () => this._notification.error('No se pudieron reunir las filas del filtro.'),
    });
  }

  private confirmBulk(items: ConsigneeImportItem[]): void {
    const sample = items.slice(0, 3).flatMap((r) => r.warnings.filter((w) => !w.verified).map((w) => `${w.original} → ${w.suggested}`));
    if (!confirm(`Verificará las correcciones de ${items.length} filas. Ejemplos:\n${sample.join('\n')}`)) return;
    this._api.bulkVerify(this.companyId(), this.session().id, 'BROKEN_CHARACTERS', items.map((r) => r.id)).subscribe({
      next: (r) => { this._notification.success(`${r.verified} filas verificadas.`); this.changed.emit(); },
      error: (err) => this._notification.error(err?.error?.message ?? 'No se pudo verificar en bloque.'),
    });
  }

  /** La fila se edita en un diálogo (cabecera con cierre, contenido con scroll, pie fijo). */
  openItem(item: ConsigneeImportItem): void {
    this.selected.set(item);
    const data: ImportItemDialogData = {
      companyId: this.companyId(), sessionId: this.session().id, item, onChanged: () => this.changed.emit(),
    };
    this._dialog.open(ImportItemPanelComponent, { panelClass: 'dialog-panel', width: '780px', maxWidth: '95vw', maxHeight: '92vh', data })
      .afterClosed().subscribe(() => this.selected.set(null));
  }
}
