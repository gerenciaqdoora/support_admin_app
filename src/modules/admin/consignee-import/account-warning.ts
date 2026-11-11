import { AccountCheck } from '@core/models/supplier-import.model';

export interface AccountWarning { message: string; hint: string | null; actionLabel: string | null; }

/** Aviso de la cabecera cuando la cuenta maestra no calza con la cuenta mayor del archivo; null si no hay nada que avisar. */
export function accountWarning(check: AccountCheck | null | undefined, masterName: string): AccountWarning | null {
  if (!check) return null;
  const file = check.file_codes.join(', ');
  const hint = check.can_reassign || check.matches !== false
    ? null
    : 'No se puede reasignar automáticamente: la cuenta del archivo no existe como cuenta mayor del plan o el archivo trae más de una cuenta.';

  if (check.matches === false) {
    const message = check.master
      ? `El archivo trae la cuenta mayor ${file}, pero la cuenta maestra ${masterName} asignada es ${check.master.display_code} (${check.master.name}).`
      : `La empresa no tiene cuenta maestra ${masterName} asignada y el archivo trae la cuenta mayor ${file}.`;
    return { message, hint, actionLabel: check.can_reassign && check.target ? `Reasignar a ${check.target.code}` : null };
  }
  if (check.master === null) {
    return { message: `La empresa no tiene cuenta maestra ${masterName} asignada: configúrela en el plan de cuentas o agregue la columna Cuenta mayor al archivo.`, hint: null, actionLabel: null };
  }
  return null;
}
