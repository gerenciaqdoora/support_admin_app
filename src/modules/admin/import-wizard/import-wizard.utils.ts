import { Paginated, Pagination } from '@core/models/consignee-import.model';
import { ImportStep, ImportStepStatus, ImportWizardProgress } from '@core/models/import-wizard.model';

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
  providers: (companyId) => ['/admin/supplier-import', companyId],
  employees: (companyId) => ['/admin/employee-import', companyId],
  issuers: (companyId) => ['/admin/issuer-import', companyId],
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

/** Grupo único de cada paso: lo resuelto gana; si no, lo bloqueado; si no, su estado. */
export type StepBucket = 'completed' | 'not_applicable' | 'blocked' | 'in_progress' | 'pending';
export type StepFilter = 'all' | StepBucket;
export type StepCounts = Record<StepFilter, number>;

export function stepBucket(step: ImportStep): StepBucket {
  if (step.status === 'completed' || step.status === 'not_applicable') return step.status;
  if (step.blocked) return 'blocked';
  return step.status;
}

export function countByStatus(steps: ImportStep[]): StepCounts {
  const counts: StepCounts = { all: steps.length, pending: 0, in_progress: 0, completed: 0, not_applicable: 0, blocked: 0 };
  for (const step of steps) counts[stepBucket(step)]++;

  return counts;
}

export function filterSteps(steps: ImportStep[], filter: StepFilter): ImportStep[] {
  return filter === 'all' ? steps : steps.filter((s) => stepBucket(s) === filter);
}

const BUCKET_LABELS: Record<StepBucket, string> = {
  pending: 'Pendiente', in_progress: 'En curso', completed: 'Completado', not_applicable: 'No aplica', blocked: 'Bloqueado',
};

const BUCKET_CLASSES: Record<StepBucket, string> = {
  pending: 'bg-slate-50 text-slate-600 border-slate-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-100',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  not_applicable: 'bg-amber-50 text-amber-700 border-amber-100',
  blocked: 'bg-rose-50 text-rose-700 border-rose-100',
};

export function bucketLabel(bucket: StepBucket): string { return BUCKET_LABELS[bucket]; }
export function bucketClass(bucket: StepBucket): string { return BUCKET_CLASSES[bucket]; }

/** Primer paso por orden que se puede trabajar ahora (pendiente o en curso y sin bloqueo). */
export function nextStep(steps: ImportStep[]): ImportStep | null {
  return [...steps]
    .sort((a, b) => a.order - b.order)
    .find((s) => {
      const bucket = stepBucket(s);

      return bucket === 'pending' || bucket === 'in_progress';
    }) ?? null;
}

export function dependencyTitles(step: ImportStep, steps: ImportStep[]): string[] {
  return step.depends_on.map((code) => steps.find((s) => s.code === code)?.title ?? code);
}

export function summaryText(step: ImportStep): string {
  const s = step.summary;
  if (!s) return '—';

  return s.failed > 0 ? `${s.imported} importadas · ${s.failed} fallidas` : `${s.imported} importadas`;
}

export function segmentWidth(count: number, total: number): number {
  return total ? (count / total) * 100 : 0;
}

/** Paginación local con la misma forma que `Paginated` (página base 0), para las tablas sin API paginada. */
export function paginate<T>(items: T[], page: number, size: number): Paginated<T> {
  const length = items.length;
  const lastPage = Math.max(0, Math.ceil(length / size) - 1);
  const current = Math.min(Math.max(0, page), lastPage);
  const start = current * size;
  const records = items.slice(start, start + size);
  const pagination: Pagination = {
    length, size, page: current, lastPage,
    startIndex: length ? start + 1 : 0, endIndex: start + records.length,
  };

  return { records, pagination };
}
