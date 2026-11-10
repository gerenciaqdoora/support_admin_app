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
