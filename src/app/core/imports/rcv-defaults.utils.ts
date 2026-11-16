import { RcvApplyPreview, RcvDefaultConfig, RcvDefaultRun, RcvOperation } from '../models/rcv-defaults.model';

/** Textos según el rol del auxiliar al que se aplican las cuentas: proveedor (compra) o consignatario (venta). */
export const RCV_WORDING: Record<RcvOperation, { operation: string; singular: string; plural: string; title: string }> = {
  purchase: { operation: 'compra', singular: 'proveedor', plural: 'proveedores', title: 'Proveedor' },
  sale: { operation: 'venta', singular: 'consignatario', plural: 'consignatarios', title: 'Consignatario' },
};

/** Estado del conjunto de defaults de la operación: ninguno, solo afecta/exenta o ambas. */
export function defaultsStatus(config: Pick<RcvDefaultConfig, 'purpose'>[], operation: RcvOperation = 'purchase'): 'none' | 'partial' | 'complete' {
  const defined = config.filter((c) => c.purpose.startsWith(`rcv_default_${operation}_`)).length;
  return defined === 0 ? 'none' : defined === 1 ? 'partial' : 'complete';
}

/** Una ejecución en cola o corriendo bloquea el inicio de otra en la empresa. */
export function isRunActive(run: Pick<RcvDefaultRun, 'status'>): boolean {
  return run.status === 'queued' || run.status === 'running';
}

export function runSummary(run: Pick<RcvDefaultRun, 'applied' | 'skipped' | 'failed'>): string {
  // Los contadores son por cuenta (afecta y exenta de cada auxiliar), no por auxiliar
  return `${run.applied} ${run.applied === 1 ? 'cuenta configurada' : 'cuentas configuradas'} · ${run.skipped} sin cambios · ${run.failed} con error`;
}

/**
 * Auxiliares por configurar según el conteo previo: afecta y exenta se aplican al mismo
 * conjunto de auxiliares, así que se toma el mayor de los dos y no la suma.
 */
export function pendingCount(preview: RcvApplyPreview | null): number {
  if (!preview) return 0;
  return Math.max(preview.affected?.a_crear ?? 0, preview.exempt?.a_crear ?? 0);
}

export function applyLabel(pending: number, operation: RcvOperation = 'purchase'): string {
  const w = RCV_WORDING[operation];
  if (pending <= 0) return `No hay ${w.plural} por configurar`;
  const formatted = new Intl.NumberFormat('es-CL').format(pending);
  return `Aplicar a ${formatted} ${pending === 1 ? w.singular : w.plural} sin configuración`;
}
