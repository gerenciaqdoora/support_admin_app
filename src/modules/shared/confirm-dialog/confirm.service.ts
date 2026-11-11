import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, map } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from './confirm-dialog.component';

/**
 * Confirmación estándar del portal. Úsala SIEMPRE en lugar de `confirm()` nativo para
 * eliminaciones, creaciones masivas, procesos grandes y acciones críticas.
 * Emite `true` solo si el usuario confirma (cerrar con Esc o hacer clic fuera equivale a cancelar).
 */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private _dialog = inject(MatDialog);

  confirm(data: ConfirmDialogData): Observable<boolean> {
    return this._dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, {
        data,
        width: '448px',
        maxWidth: '95vw',
        panelClass: 'confirm-dialog-panel',
        autoFocus: 'dialog',
      })
      .afterClosed()
      .pipe(map((r) => r === true));
  }
}
