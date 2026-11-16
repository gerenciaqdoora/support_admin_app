import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { Observable } from 'rxjs';
import { MasterAccountOption, MasterAccountOptions } from '@core/models/consignee-import.model';
import { ImportRequirementsBase } from '@core/services/import-session-api';
import { NotificationService } from '@core/services/notification.service';
import { DialogHeaderComponent } from '../../puc-manager/dialogs/shared/header/header.component';
import { DialogFooterComponent } from '../../puc-manager/dialogs/shared/footer/footer.component';

export interface MasterAccountAssignData {
  /** Nombre de la cuenta maestra (p. ej. «Cliente Nacional»). */
  masterName: string;
  /** Texto bajo el selector: qué cuentas se ofrecen y qué cambia al asignarla. */
  hint: string;
  /** Aviso de quienes dejan de contar con la cuenta actual (solo si la maestra define un rol). */
  membersLabel?: string;
  load: () => Observable<MasterAccountOptions>;
  assign: (account: { type: string; account_id: number }) => Observable<ImportRequirementsBase>;
  /** Cuenta vigente (código de despliegue y nombre); null si la empresa no tiene una. */
  current: { display_code: string; name: string } | null;
}

/** Elige, entre las cuentas del plan de la empresa, la que será la cuenta maestra. Cierra con los requisitos ya recalculados. */
@Component({
  selector: 'app-master-account-assign-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, DialogHeaderComponent, DialogFooterComponent],
  template: `
    <div class="standard-dialog-container relative">
      <app-dialog-header [title]="(data.current ? 'Cambiar' : 'Asignar') + ' cuenta maestra ' + data.masterName" [showCloseButton]="true" (closeDialog)="dialogRef.close()"></app-dialog-header>

      <div class="standard-dialog-content space-y-4 p-6">
        @if (loading()) {
          <div class="h-12 animate-pulse rounded-xl bg-slate-100" role="status" aria-label="Cargando cuentas del plan"></div>
        } @else if (loadFailed()) {
          <p class="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-800" role="alert">No se pudieron cargar las cuentas del plan de la empresa.</p>
        } @else if (accounts().length === 0) {
          <p class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900" role="status">
            El plan de cuentas no tiene cuentas disponibles: deben ser de la clase contable que admite esta cuenta maestra y no ser ya maestras de otra categoría.
            Configúrelas en el plan de cuentas de la empresa.
          </p>
        } @else {
          @if (data.current) {
            <p class="text-xs text-slate-600">Cuenta vigente: <span class="font-mono font-black text-slate-900">{{ data.current.display_code }}</span> · {{ data.current.name }}</p>
          }
          <div>
            <label for="master-account-select" class="block text-[10px] font-black uppercase tracking-widest text-slate-500">Cuenta del plan</label>
            <select id="master-account-select" [formControl]="selected"
              class="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-blue-600">
              <option [ngValue]="null">Seleccione una cuenta…</option>
              @for (a of accounts(); track a.type + a.account_id) {
                <option [value]="a.type + ':' + a.account_id">{{ a.code }} · {{ a.name }}</option>
              }
            </select>
          </div>
          @if (data.current && data.membersLabel && members() > 0) {
            <p class="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-900" role="alert">
              {{ members() }} {{ members() === 1 ? 'auxiliar tiene' : 'auxiliares tienen' }} la cuenta actual y dejarán de contar como {{ data.membersLabel }} hasta recibir la nueva;
              los que se importen la reciben al importarse.
            </p>
          }
          <p class="text-[11px] text-slate-500">{{ data.hint }} Cambia la configuración contable de la empresa.</p>
        }
      </div>

      <app-dialog-footer>
        <button type="button" (click)="dialogRef.close()" class="px-4 py-2 rounded-xl border font-bold">Cancelar</button>
        <button type="button" (click)="save()" [disabled]="busy() || !selected.value" class="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold disabled:cursor-not-allowed disabled:opacity-40">
          {{ busy() ? 'Guardando…' : (data.current ? 'Cambiar cuenta' : 'Asignar cuenta') }}
        </button>
      </app-dialog-footer>
    </div>
  `,
})
export class MasterAccountAssignDialogComponent implements OnInit {
  protected readonly data = inject<MasterAccountAssignData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject<MatDialogRef<MasterAccountAssignDialogComponent, ImportRequirementsBase | undefined>>(MatDialogRef);
  private readonly notification = inject(NotificationService);

  protected readonly loading = signal(true);
  protected readonly loadFailed = signal(false);
  protected readonly busy = signal(false);
  protected readonly accounts = signal<MasterAccountOption[]>([]);
  protected readonly members = signal(0);
  protected readonly selected = new FormControl<string | null>(null);

  ngOnInit(): void {
    this.data.load().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (o) => { this.accounts.set(o.accounts); this.members.set(o.members_on_current_master); },
      error: () => this.loadFailed.set(true),
    });
  }

  protected save(): void {
    const [type, id] = (this.selected.value ?? '').split(':');
    if (!type || !id) return;

    this.busy.set(true);
    this.data.assign({ type, account_id: Number(id) }).pipe(finalize(() => this.busy.set(false))).subscribe({
      next: (requirements) => { this.notification.success('Cuenta maestra asignada.'); this.dialogRef.close(requirements); },
      error: (err) => this.notification.error(err?.error?.message ?? 'No se pudo asignar la cuenta maestra.'),
    });
  }
}
