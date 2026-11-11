import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, effect, inject, signal, untracked } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { COLUMN_LABELS, SIGAD_CLIENTES_V1 } from '@core/imports/sigad-clientes-v1';
import { statusLabel } from '../consignee-import.utils';
import { Observable } from 'rxjs';
import { ConsigneeImportService } from '@core/services/consignee-import.service';
import { NotificationService } from '@core/services/notification.service';
import { ConsigneeImportItem, LegalRepresentativeRow, NormalizedConsignee } from '@core/models/consignee-import.model';
import { SelectScrollAndFilterComponent } from '@shared/select-with-filter/select-with-filter.component';
import { DialogHeaderComponent } from '../../puc-manager/dialogs/shared/header/header.component';
import { DialogFooterComponent } from '../../puc-manager/dialogs/shared/footer/footer.component';

interface MunicipalityOption { id: number; code: string; name: string; filter_name: string; }

export interface ImportItemDialogData {
  companyId: number;
  sessionId: number;
  item: ConsigneeImportItem;
  /** Avisa a la vista de trabajo que la fila cambió (refresca contadores y tabla). */
  onChanged: () => void;
}

@Component({
  selector: 'app-import-item-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatTooltipModule, SelectScrollAndFilterComponent, DialogHeaderComponent, DialogFooterComponent],
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

      @if (item().warnings.length) {
        <section class="space-y-2" aria-label="Advertencias de la fila">
          @for (w of item().warnings; track $index) {
            <div class="rounded-2xl border px-4 py-3 flex items-start justify-between gap-4"
              [class]="w.verified ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'">
              <div class="min-w-0">
                <p class="text-[10px] font-black uppercase tracking-widest" [class]="w.verified ? 'text-emerald-700' : 'text-amber-700'">
                  {{ w.verified ? 'Corrección verificada' : 'Caracteres corregidos · verifique' }}
                </p>
                <p class="mt-1.5 flex flex-wrap items-center gap-2 text-xs">
                  <span class="rounded-lg bg-white/80 border border-slate-200 px-2 py-0.5 font-mono text-slate-500 line-through decoration-red-400">{{ w.original }}</span>
                  <span class="text-slate-400" aria-hidden="true">→</span>
                  <span class="rounded-lg bg-white border border-slate-200 px-2 py-0.5 font-mono font-bold text-slate-900">{{ w.suggested }}</span>
                </p>
              </div>
              @if (!w.verified) {
                <button type="button" (click)="verify(w.code)" [disabled]="busy()"
                  class="shrink-0 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 cursor-pointer disabled:opacity-40">
                  Verificar
                </button>
              } @else {
                <svg class="h-5 w-5 shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 13l4 4L19 7" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>
              }
            </div>
          }
        </section>
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

      @if (item().branch; as b) {
        <div class="text-xs bg-slate-50 rounded-lg p-2 space-y-1">
          <p class="font-bold">Sucursales del mismo RUT ({{ b.size }})</p>
          @for (s of siblings(); track s.id) {
            <div class="flex justify-between">
              <span>Fila {{ s.row_number }}: {{ s.normalized.address }} ({{ s.original['H'] }})</span>
              @if (!s.branch?.chosen) {
                <button type="button" (click)="chooseBranch(s.id)" class="underline text-blue-700">Usar esta sucursal</button>
              } @else {
                <span class="text-green-800">Elegida</span>
              }
            </div>
          }
        </div>
      }

      <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <section class="lg:col-span-2" aria-label="Datos originales de SIGAD">
          <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Original SIGAD</h3>
          <dl class="rounded-2xl border border-slate-200 bg-slate-50/60 divide-y divide-slate-100">
            @for (col of originalColumns; track col) {
              <div class="px-4 py-2 flex items-baseline justify-between gap-4">
                <dt class="text-[10px] font-black uppercase tracking-wide text-slate-400 shrink-0 cursor-help"
                  [matTooltip]="'Columna ' + col + ' · ' + sigadHeader(col)" matTooltipClass="sigad-tooltip" matTooltipPosition="above">
                  {{ columnLabel(col) }}
                  <span class="ml-1 font-mono text-[9px] normal-case text-slate-300">{{ col }}</span>
                </dt>
                <dd class="text-xs font-bold text-slate-800 text-right break-all">
                  {{ item().original[col] || '—' }}
                </dd>
              </div>
            }
          </dl>
        </section>

        <form [formGroup]="form" class="lg:col-span-3 space-y-4">
          <h3 class="text-[10px] font-black uppercase tracking-widest text-slate-500">A importar</h3>

          <div class="grid grid-cols-3 gap-4">
            <div>
              <label for="f-doc-code" [class]="lbl">Tipo de documento</label>
              <select id="f-doc-code" formControlName="document_code" [class]="field">
                <option value="03">03 RUT</option><option value="04">04 Pasaporte</option>
              </select>
            </div>
            <div class="col-span-2">
              <label for="f-doc-number" [class]="lbl">Documento</label>
              <input id="f-doc-number" formControlName="document_number" [class]="field" autocomplete="off" />
            </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div>
              <label for="f-person" [class]="lbl">Tipo de persona</label>
              <select id="f-person" formControlName="person_type" [class]="field">
                <option value="JURIDICA">Jurídica</option><option value="NATURAL">Natural</option>
              </select>
            </div>
            <div class="col-span-2">
              <label for="f-name" [class]="lbl">Nombre</label>
              <input id="f-name" formControlName="name" [class]="field" autocomplete="off" />
            </div>
          </div>

          <div>
            <label for="f-address" [class]="lbl">Dirección</label>
            <input id="f-address" formControlName="address" [class]="field" autocomplete="off" />
          </div>

          <app-select-with-filter class="block w-full" [parentForm]="form" controlName="municipality" [allOptions]="municipalities()" matLabel="Comuna" />

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="f-email" [class]="lbl">Email</label>
              <input id="f-email" formControlName="email" type="email" [class]="field" autocomplete="off" />
            </div>
            <div>
              <label for="f-phone" [class]="lbl">Teléfono</label>
              <input id="f-phone" formControlName="phone" [class]="field" autocomplete="off" />
            </div>
          </div>

          <div>
            <label for="f-giro" [class]="lbl">Giro</label>
            <input id="f-giro" formControlName="giro" [class]="field" autocomplete="off" />
          </div>

          <div formArrayName="legal_representatives" class="space-y-3">
            <p [class]="lbl">Representantes legales</p>
            @for (rep of reps.controls; track $index; let i = $index) {
              <div [formGroupName]="i" class="rounded-2xl border border-slate-200 p-4 space-y-3 bg-white">
                <div class="grid grid-cols-3 gap-3">
                  <div class="col-span-2">
                    <label [for]="'r-name-' + i" [class]="lbl">Nombre</label>
                    <input [id]="'r-name-' + i" formControlName="name" [class]="field" autocomplete="off" />
                  </div>
                  <div>
                    <label [for]="'r-rut-' + i" [class]="lbl">RUT</label>
                    <input [id]="'r-rut-' + i" formControlName="rut" [class]="field" autocomplete="off" />
                  </div>
                </div>
                <div>
                  <label [for]="'r-email-' + i" [class]="lbl">Email</label>
                  <input [id]="'r-email-' + i" formControlName="email" type="email" [class]="field" autocomplete="off" />
                </div>
                <button type="button" (click)="reps.removeAt(i)" class="text-xs font-bold text-red-600 hover:underline cursor-pointer">Quitar representante</button>
              </div>
            }
            <button type="button" (click)="addRep()" class="text-xs font-bold text-blue-600 hover:underline cursor-pointer">+ Agregar representante</button>
          </div>
        </form>
      </div>

      </div>

      <app-dialog-footer>
        <button type="button" (click)="dialogRef.close()" class="px-4 py-2 rounded-xl border font-bold">Cerrar</button>
        @if (item().status !== 'skipped') {
          <button type="button" (click)="skip()" [disabled]="busy() || item().status === 'imported'" class="px-4 py-2 rounded-xl border font-bold">Omitir</button>
        } @else if (item().skip_reason !== 'branch_discarded') {
          <button type="button" (click)="restore()" [disabled]="busy()" class="px-4 py-2 rounded-xl border font-bold">Restaurar</button>
        }
        <button type="button" (click)="save()" [disabled]="busy() || item().status === 'imported'" class="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold">Guardar</button>
      </app-dialog-footer>
    </div>
  `,
})
export class ImportItemPanelComponent implements OnInit {
  readonly dialogRef = inject<MatDialogRef<ImportItemPanelComponent>>(MatDialogRef);
  private readonly data = inject<ImportItemDialogData>(MAT_DIALOG_DATA);

  readonly companyId = signal(this.data.companyId);
  readonly sessionId = signal(this.data.sessionId);
  readonly item = signal<ConsigneeImportItem>(this.data.item);

  private _api = inject(ConsigneeImportService);
  private _notification = inject(NotificationService);
  private _fb = inject(FormBuilder);
  private _destroyRef = inject(DestroyRef);

  readonly lbl = 'block mb-1.5 text-xs font-bold text-gray-700';
  readonly field = 'h-11 w-full rounded-xl border border-gray-300 bg-white px-3.5 text-sm text-gray-900 shadow-sm outline-none transition-all focus:border-primary-500 focus:ring-1 focus:ring-primary-500';
  readonly originalColumns = ['B', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'U', 'V', 'AC', 'AH', 'AI', 'CN'];
  readonly municipalities = signal<MunicipalityOption[]>([]);
  readonly siblings = signal<ConsigneeImportItem[]>([]);
  readonly busy = signal(false);
  form: FormGroup = this._fb.group({});

  statusText(): string { return statusLabel(this.item().status); }
  columnLabel(col: string): string { return COLUMN_LABELS[col] ?? col; }
  sigadHeader(col: string): string { return SIGAD_CLIENTES_V1.headers[col] ?? col; }

  get reps(): FormArray { return this.form.get('legal_representatives') as FormArray; }

  constructor() {
    // El padre reemplaza la fila tras guardar o al elegir otra: se reconstruye el formulario con la fila vigente.
    effect(() => {
      this.item();
      untracked(() => { this.buildForm(); this.selectMunicipality(); this.loadSiblings(); });
    });
  }

  ngOnInit(): void {
    this._api.municipalities(this.companyId()).pipe(takeUntilDestroyed(this._destroyRef)).subscribe((list) => {
      this.municipalities.set(list.map((m) => ({ ...m, filter_name: `${m.code} | ${m.name}` })));
      this.selectMunicipality();
    });
  }

  private selectMunicipality(): void {
    this.form.get('municipality')?.setValue(this.municipalities().find((m) => m.id === this.item().normalized.municipality_id) ?? null);
  }

  private buildForm(): void {
    const n = this.item().normalized;
    this.form = this._fb.group({
      document_code: [n.document_code], document_number: [n.document_number], person_type: [n.person_type],
      name: [n.name], address: [n.address], municipality: [null as MunicipalityOption | null], email: [n.email], phone: [n.phone], giro: [n.giro],
      legal_representatives: this._fb.array(n.legal_representatives.map((r) => this.repGroup(r))),
    });
  }

  private repGroup(r?: LegalRepresentativeRow): FormGroup {
    return this._fb.group({ kind: [r?.kind ?? 'IMPO'], name: [r?.name ?? ''], rut: [r?.rut ?? ''], email: [r?.email ?? null], is_default: [r?.is_default ?? false] });
  }

  addRep(): void {
    this.reps.push(this.repGroup({ kind: 'IMPO', name: '', rut: '', email: null, is_default: this.reps.length === 0 }));
  }

  private loadSiblings(): void {
    const branch = this.item().branch;
    if (!branch) { this.siblings.set([]); return; }
    this._api.listItems(this.companyId(), this.sessionId(), { group_key: branch.group_key, page: 0, size: 50 })
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe((r) => this.siblings.set(r.records));
  }

  save(): void {
    const raw = this.form.getRawValue();
    const normalized: NormalizedConsignee = {
      document_code: raw.document_code, document_number: raw.document_number?.trim() || null, person_type: raw.person_type,
      name: (raw.name ?? '').trim().toUpperCase(), address: (raw.address ?? '').trim().toUpperCase(),
      municipality_id: raw.municipality?.id ?? null, email: raw.email?.trim().toLowerCase() || null,
      phone: raw.phone?.trim() || null, giro: raw.giro?.trim().toUpperCase() || null,
      external_code: this.item().normalized.external_code ?? null, // solo lectura: el servidor lo toma de la columna original
      legal_representatives: raw.legal_representatives.map((r: LegalRepresentativeRow) => ({
        ...r, name: (r.name ?? '').trim().toUpperCase(), rut: (r.rut ?? '').trim().toUpperCase(), email: r.email?.trim().toLowerCase() || null,
      })),
    };
    this.run(this._api.updateItem(this.companyId(), this.item().id, normalized), 'Fila guardada.');
  }

  verify(code: string): void { this.run(this._api.verifyItem(this.companyId(), this.item().id, [code]), 'Advertencia verificada.', false); }
  skip(): void { this.run(this._api.skipItem(this.companyId(), this.item().id), 'Fila omitida.'); }
  restore(): void { this.run(this._api.restoreItem(this.companyId(), this.item().id), 'Fila restaurada.'); }

  chooseBranch(itemId: number): void {
    this._api.chooseBranch(this.companyId(), itemId).subscribe({
      next: () => { this._notification.success('Sucursal elegida.'); this.loadSiblings(); this.data.onChanged(); },
      error: (err) => this._notification.error(err?.error?.message ?? 'No se pudo elegir la sucursal.'),
    });
  }

  /** Éxito: avisa con la notificación del portal y cierra el diálogo (salvo que se pida seguir editando). En error se mantiene abierto. */
  private run(obs: Observable<ConsigneeImportItem>, message: string, closeOnSuccess = true): void {
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
