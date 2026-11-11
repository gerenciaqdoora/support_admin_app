import { ChangeDetectionStrategy, Component, effect, inject, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { NotificationService } from '@core/services/notification.service';
import { ImportSessionApi } from '@core/services/import-session-api';
import { NormalizedSupplier, SupplierCandidate, SupplierImportItem } from '@core/models/supplier-import.model';
import { PROVEEDORES_V1 } from '@core/imports/proveedores-v1';
import { statusLabel } from '../../consignee-import/consignee-import.utils';
import { DialogHeaderComponent } from '../../puc-manager/dialogs/shared/header/header.component';
import { DialogFooterComponent } from '../../puc-manager/dialogs/shared/footer/footer.component';

export interface SupplierItemDialogData {
  companyId: number;
  sessionId: number;
  item: SupplierImportItem;
  /** API de la importación (proveedores o empleados): el diálogo es el mismo para todos los roles. */
  api: ImportSessionApi<SupplierImportItem, NormalizedSupplier>;
  /** Avisa a la vista de trabajo que la fila cambió (refresca contadores y tabla). */
  onChanged: () => void;
}

/** Diálogo de una fila de una importación por rol (proveedores, empleados): corregir código, RUT y nombre, y resolver candidatas y conflictos de nombre. */
@Component({
  selector: 'app-supplier-item-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DialogHeaderComponent, DialogFooterComponent],
  template: `
    <div class="standard-dialog-container relative">
      <app-dialog-header [title]="'Fila ' + item().row_number + ' · ' + statusText()" [showCloseButton]="true" (closeDialog)="dialogRef.close()"></app-dialog-header>

      <div class="standard-dialog-content p-6 space-y-4">

        @if (item().errors.length || item().failure_message) {
          <section class="rounded-2xl border border-red-200 bg-red-50 px-4 py-3" role="alert" aria-label="Errores de la fila">
            <h3 class="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-700">
              <svg class="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              Corregir antes de importar
            </h3>
            <ul class="mt-2 space-y-1">
              @for (e of item().errors; track $index) {
                <li class="text-xs font-semibold text-red-800 flex gap-2"><span aria-hidden="true">•</span>{{ e.message }}</li>
              }
              @if (item().failure_message) {
                <li class="text-xs font-semibold text-red-800 flex gap-2"><span aria-hidden="true">•</span>{{ item().failure_message }}</li>
              }
            </ul>
          </section>
        }

        @if (candidates().length) {
          <section class="rounded-2xl border border-blue-200 bg-blue-50/60 px-4 py-3" aria-label="Fichas existentes con este nombre">
            <h3 class="text-[10px] font-black uppercase tracking-widest text-blue-700">Fichas existentes con este nombre</h3>
            <ul class="mt-2 space-y-2">
              @for (c of candidates(); track c.id) {
                <li class="flex items-center justify-between gap-3 rounded-xl bg-white border border-blue-100 px-3 py-2">
                  <span class="min-w-0 text-xs"><span class="font-mono font-bold text-slate-900">{{ c.rut }}</span> · <span class="text-slate-700">{{ c.name }}</span></span>
                  <button type="button" (click)="useCandidate(c)" [disabled]="busy()"
                    class="shrink-0 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40">
                    Usar
                  </button>
                </li>
              }
            </ul>
          </section>
        }

        @for (w of item().warnings; track $index) {
          @if (w.code === 'BROKEN_CHARACTERS') {
            <section class="rounded-2xl border px-4 py-3 flex items-start justify-between gap-4" [class]="w.verified ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'" aria-label="Caracteres corregidos">
              <div class="min-w-0">
                <p class="text-[10px] font-black uppercase tracking-widest" [class]="w.verified ? 'text-emerald-700' : 'text-amber-700'">
                  {{ w.verified ? 'Corrección verificada' : 'Caracteres corregidos · verifique' }}
                </p>
                <p class="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                  <span class="rounded-lg bg-white/80 border border-slate-200 px-2 py-0.5 font-mono text-slate-500 line-through decoration-red-400">{{ w.original }}</span>
                  <span class="text-slate-400" aria-hidden="true">→</span>
                  <span class="rounded-lg bg-white border border-slate-200 px-2 py-0.5 font-mono font-bold text-slate-900">{{ w.suggested }}</span>
                </p>
                @if (!w.verified) { <p class="mt-1.5 text-[11px] text-amber-800">Si la sugerencia no es correcta (por ejemplo, una tilde en vez de Ñ), edite el nombre abajo y guarde.</p> }
              </div>
              @if (!w.verified) {
                <button type="button" (click)="verify(w.code)" [disabled]="busy()"
                  class="shrink-0 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40">
                  Verificar
                </button>
              } @else {
                <svg class="h-5 w-5 shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
              }
            </section>
          } @else {
          <section class="rounded-2xl border px-4 py-3 space-y-3" [class]="w.verified ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'" aria-label="Conflicto de nombre">
            <p class="text-[10px] font-black uppercase tracking-widest" [class]="w.verified ? 'text-emerald-700' : 'text-amber-700'">
              {{ w.verified ? 'Nombre elegido' : 'El auxiliar ya existe con otro nombre · elija cuál conservar' }}
            </p>
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div class="rounded-xl bg-white/80 border border-slate-200 px-3 py-2"><dt class="text-[9px] font-black uppercase tracking-widest text-slate-400">Nombre existente</dt><dd class="font-bold text-slate-900 break-words">{{ w.original }}</dd></div>
              <div class="rounded-xl bg-white/80 border border-slate-200 px-3 py-2"><dt class="text-[9px] font-black uppercase tracking-widest text-slate-400">Nombre del archivo</dt><dd class="font-bold text-slate-900 break-words">{{ w.suggested }}</dd></div>
            </dl>
            <div class="flex flex-wrap gap-2">
              <button type="button" (click)="chooseName('keep_existing')" [disabled]="busy()"
                class="px-4 py-2 rounded-xl border border-slate-300 bg-white text-[10px] font-black uppercase tracking-widest cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                [class.ring-2]="item().normalized.name_choice === 'keep_existing'" [class.ring-emerald-500]="item().normalized.name_choice === 'keep_existing'">Conservar el existente</button>
              <button type="button" (click)="chooseName('replace')" [disabled]="busy()"
                class="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                [class.ring-2]="item().normalized.name_choice === 'replace'" [class.ring-emerald-500]="item().normalized.name_choice === 'replace'">Usar el del archivo</button>
            </div>
          </section>
          }
        }

        @if (item().infos.length) {
          <section class="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3" aria-label="Información de la fila">
            <ul class="space-y-1">
              @for (i of item().infos; track $index) {
                <li class="text-xs font-semibold text-blue-900 flex items-start gap-2">
                  <svg class="h-4 w-4 shrink-0 mt-px text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  {{ i.message }}
                </li>
              }
            </ul>
          </section>
        }

        <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <section class="lg:col-span-2" aria-label="Datos originales del archivo">
            <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Original del archivo</h3>
            <dl class="rounded-2xl border border-slate-200 bg-slate-50/60 divide-y divide-slate-100">
              @for (key of originalKeys; track key) {
                <div class="px-4 py-2 flex items-baseline justify-between gap-4">
                  <dt class="text-[10px] font-black uppercase tracking-wide text-slate-400 shrink-0">{{ label(key) }}</dt>
                  <dd class="text-xs font-bold text-slate-800 text-right break-all">{{ item().original[key] || '—' }}</dd>
                </div>
              }
            </dl>
          </section>

          <form [formGroup]="form" class="lg:col-span-3 space-y-4">
            <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-500">A importar</h3>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label for="s-code" [class]="lbl">Código</label>
                <input id="s-code" formControlName="code" [class]="field" autocomplete="off" />
              </div>
              <div class="col-span-2">
                <label for="s-rut" [class]="lbl">RUT</label>
                <input id="s-rut" formControlName="rut" [class]="field" autocomplete="off" placeholder="12345678-9" />
              </div>
            </div>
            <div>
              <label for="s-name" [class]="lbl">Nombre</label>
              <input id="s-name" formControlName="name" [class]="field" autocomplete="off" />
            </div>
          </form>
        </div>
      </div>

      <app-dialog-footer>
        <button type="button" (click)="dialogRef.close()" class="cursor-pointer px-4 py-2 rounded-xl border font-bold">Cerrar</button>
        @if (item().status !== 'skipped') {
          <button type="button" (click)="skip()" [disabled]="busy() || item().status === 'imported'" class="cursor-pointer disabled:cursor-not-allowed px-4 py-2 rounded-xl border font-bold">Omitir</button>
        } @else {
          <button type="button" (click)="restore()" [disabled]="busy()" class="cursor-pointer disabled:cursor-not-allowed px-4 py-2 rounded-xl border font-bold">Restaurar</button>
        }
        <button type="button" (click)="save()" [disabled]="busy() || item().status === 'imported'" class="cursor-pointer disabled:cursor-not-allowed px-4 py-2 rounded-xl bg-blue-600 text-white font-bold">Guardar</button>
      </app-dialog-footer>
    </div>
  `,
})
export class SupplierItemPanelComponent {
  readonly dialogRef = inject<MatDialogRef<SupplierItemPanelComponent>>(MatDialogRef);
  private readonly data = inject<SupplierItemDialogData>(MAT_DIALOG_DATA);

  readonly item = signal<SupplierImportItem>(this.data.item);
  readonly busy = signal(false);

  private _api = this.data.api;
  private _notification = inject(NotificationService);
  private _fb = inject(FormBuilder);

  readonly lbl = 'block mb-1.5 text-xs font-bold text-gray-700';
  readonly field = 'h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 text-sm text-gray-900 shadow-sm outline-none transition-all focus:border-primary-500 focus:ring-1 focus:ring-primary-500';
  readonly originalKeys = ['code', 'rut', 'name', 'account_code'];
  form = this._fb.group({ code: [''], rut: [''], name: [''] });

  constructor() {
    // El padre reemplaza la fila tras guardar: se reconstruye el formulario con la fila vigente.
    effect(() => {
      const n = this.item().normalized;
      untracked(() => this.form.reset({ code: n.code ?? '', rut: n.rut ?? '', name: n.name ?? '' }));
    });
  }

  statusText(): string { return statusLabel(this.item().status); }
  label(key: string): string { return PROVEEDORES_V1.labels[key] ?? key; }

  /** Fichas existentes que calzan por nombre, entregadas por el servidor junto al error de RUT faltante. */
  candidates(): SupplierCandidate[] {
    return this.item().errors.find((e) => e.code === 'RUT_REQUIRED')?.candidates ?? [];
  }

  useCandidate(c: SupplierCandidate): void {
    this.form.patchValue({ rut: c.rut });
    this.persist(null, 'RUT de la ficha existente aplicado.', false);
  }

  verify(code: string): void { this.run(this._api.verifyItem(this.data.companyId, this.item().id, [code]), 'Corrección verificada.', false); }

  chooseName(choice: 'keep_existing' | 'replace'): void {
    this.persist(choice, 'Nombre elegido.');
  }

  save(): void { this.persist(undefined, 'Fila guardada.'); }
  skip(): void { this.run(this._api.skipItem(this.data.companyId, this.item().id), 'Fila omitida.'); }
  restore(): void { this.run(this._api.restoreItem(this.data.companyId, this.item().id), 'Fila restaurada.'); }

  /**
   * Guarda la fila. `choice`: elección de nombre explícita; `undefined` la conserva solo si ni el RUT ni el nombre cambiaron.
   */
  private persist(choice: 'keep_existing' | 'replace' | null | undefined, message: string, closeOnSuccess = true): void {
    const raw = this.form.getRawValue();
    const current = this.item().normalized;
    const rut = raw.rut?.trim() || null;
    const name = raw.name?.trim() || null;
    const unchanged = (rut ?? '') === (current.rut ?? '') && (name ?? '') === (current.name ?? '');
    const normalized: NormalizedSupplier = {
      code: raw.code?.trim() || null, rut, name, account_code: current.account_code,
      name_choice: choice !== undefined ? choice : (unchanged ? current.name_choice : null),
    };
    this.run(this._api.updateItem(this.data.companyId, this.item().id, normalized), message, closeOnSuccess);
  }

  /** Éxito: avisa con la notificación del portal y cierra el diálogo (salvo que se pida seguir editando). En error se mantiene abierto. */
  private run(obs: Observable<SupplierImportItem>, message: string, closeOnSuccess = true): void {
    this.busy.set(true);
    obs.subscribe({
      next: (updated) => {
        this.busy.set(false);
        this._notification.success(message);
        this.data.onChanged();
        if (closeOnSuccess) { this.dialogRef.close(); } else { this.item.set(updated); }
      },
      error: (err) => { this.busy.set(false); this._notification.error(err?.error?.message ?? 'No se pudo guardar la fila.'); },
    });
  }
}
