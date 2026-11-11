import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

/** Tono visual: `danger` (rojo, acciones destructivas) o `primary` (azul, procesos grandes pero no destructivos). */
export type ConfirmTone = 'danger' | 'primary';

export interface ConfirmDialogData {
  title: string;
  message: string;
  /** Línea de advertencia en cursiva bajo el mensaje (ej. «Acción irreversible»). */
  warning?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
}

/** Popup de confirmación estándar del portal. Se abre con `ConfirmService.confirm()`. */
@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="p-10 text-center" role="alertdialog" aria-labelledby="confirm-title" aria-describedby="confirm-message">
      <div
        aria-hidden="true"
        class="w-24 h-24 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-8 shadow-sm border"
        [class.bg-red-50]="danger"
        [class.border-red-100]="danger"
        [class.bg-blue-50]="!danger"
        [class.border-blue-100]="!danger"
      >
        ⚠️
      </div>
      <h2 id="confirm-title" class="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-tight">
        {{ data.title }}
      </h2>
      <p id="confirm-message" class="text-slate-500 mt-4 text-sm font-medium leading-relaxed">
        {{ data.message }}
        @if (data.warning) {
          <span class="block mt-2 font-black text-red-500 uppercase text-[10px] tracking-widest italic">{{ data.warning }}</span>
        }
      </p>
      <div class="grid grid-cols-2 gap-4 mt-10">
        <button
          type="button"
          (click)="close(false)"
          class="px-6 py-4 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-100 transition-all active:scale-95 border border-slate-200 cursor-pointer"
        >
          {{ data.cancelText ?? 'Cancelar' }}
        </button>
        <button
          type="button"
          cdkFocusInitial
          (click)="close(true)"
          class="px-6 py-4 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg cursor-pointer"
          [class.bg-red-600]="danger"
          [class.hover:bg-red-700]="danger"
          [class.shadow-red-500/20]="danger"
          [class.bg-blue-600]="!danger"
          [class.hover:bg-blue-700]="!danger"
          [class.shadow-blue-500/20]="!danger"
        >
          {{ data.confirmText ?? 'Confirmar' }}
        </button>
      </div>
    </div>
  `,
})
export class ConfirmDialogComponent {
  protected data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
  private _ref = inject<MatDialogRef<ConfirmDialogComponent, boolean>>(MatDialogRef);

  protected get danger(): boolean {
    return (this.data.tone ?? 'danger') === 'danger';
  }

  protected close(result: boolean): void {
    this._ref.close(result);
  }
}
