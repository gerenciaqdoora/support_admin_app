import { ImportStepStatus, ImportWizardProgress } from '@core/models/import-wizard.model';

const LABELS: Record<ImportStepStatus, string> = {
  pending: 'Pendiente', in_progress: 'En curso', completed: 'Completado', not_applicable: 'No aplica',
};

const CLASSES: Record<ImportStepStatus, string> = {
  pending: 'bg-slate-50 text-slate-600 border-slate-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-100',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  not_applicable: 'bg-amber-50 text-amber-700 border-amber-100',
};

const OPEN_LABELS: Record<ImportStepStatus, string> = {
  pending: 'Iniciar', in_progress: 'Continuar', completed: 'Volver a abrir', not_applicable: 'Abrir',
};

/** Ruta del portal de cada paso del catálogo del backend. Un paso nuevo agrega aquí su entrada. */
const STEP_ROUTES: Record<string, (companyId: number) => (string | number)[]> = {
  consignees: (companyId) => ['/admin/consignee-import', companyId],
};

export function statusLabel(status: ImportStepStatus): string { return LABELS[status]; }
export function statusClass(status: ImportStepStatus): string { return CLASSES[status]; }
export function openLabel(status: ImportStepStatus): string { return OPEN_LABELS[status]; }

export function stepLink(code: string, companyId: number): (string | number)[] | null {
  return STEP_ROUTES[code]?.(companyId) ?? null;
}

export function progressPercent(progress: ImportWizardProgress): number {
  return progress.total ? Math.round((progress.completed / progress.total) * 100) : 0;
}
