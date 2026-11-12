import { ImportItemStatus } from '@core/models/consignee-import.model';

export const BATCH_SIZE = 500;
export const POLL_MS = 3000;

export function chunkRows<T>(rows: T[], size = BATCH_SIZE): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < rows.length; i += size) chunks.push(rows.slice(i, i + size));
  return chunks;
}

const LABELS: Record<ImportItemStatus, string> = {
  pending: 'Con problemas', edited: 'Editada', ready: 'Lista', skipped: 'Omitida', imported: 'Importada', failed: 'Fallida',
};

export function statusLabel(status: ImportItemStatus): string {
  return LABELS[status];
}

export function totalOpen(counts: Partial<Record<ImportItemStatus, number>>): number {
  return (['pending', 'edited', 'ready', 'failed'] as ImportItemStatus[]).reduce((sum, s) => sum + (counts[s] ?? 0), 0);
}

/** Si el conteo de filas procesadas no cambia por este tiempo se avisa que el proceso podría estar detenido. */
export const STALL_MS = 45_000;

export interface RunBase { imported: number; failed: number; }

export interface RunProgress {
  imported: number; failed: number; remaining: number; done: number; total: number; percent: number;
}

/** Avance de ESTA ejecución: descuenta lo ya cerrado al empezar (`base`) y toma `ready` como lo que falta. */
export function runProgress(counts: Partial<Record<ImportItemStatus, number>>, base: RunBase): RunProgress {
  const imported = Math.max(0, (counts.imported ?? 0) - base.imported);
  const failed = Math.max(0, (counts.failed ?? 0) - base.failed);
  const remaining = counts.ready ?? 0;
  const done = imported + failed;
  const total = done + remaining;

  return { imported, failed, remaining, done, total, percent: total ? Math.min(100, Math.round((done / total) * 100)) : 0 };
}

export function formatElapsed(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number): string => String(n).padStart(2, '0');

  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function isStalled(lastChangeMs: number, nowMs: number, limitMs: number): boolean {
  return nowMs - lastChangeMs >= limitMs;
}
