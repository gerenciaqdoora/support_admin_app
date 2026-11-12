import { STALL_MS, chunkRows, formatElapsed, isStalled, runProgress, statusLabel, totalOpen } from './consignee-import.utils';

describe('consignee-import.utils', () => {
  it('divide las filas en lotes de 500', () => {
    const rows = Array.from({ length: 1201 }, (_, i) => ({ row_number: i + 4, columns: {} }));
    expect(chunkRows(rows, 500).map((c) => c.length)).toEqual([500, 500, 201]);
  });

  it('suma las filas que aún no terminan y traduce estados', () => {
    expect(totalOpen({ pending: 3, edited: 1, ready: 2, failed: 1, imported: 9, skipped: 4 })).toBe(7);
    expect(statusLabel('failed')).toBe('Fallida');
  });

  it('calcula el avance de esta ejecución y no cuenta lo anterior', () => {
    expect(runProgress({ imported: 70, failed: 2, ready: 28 }, { imported: 0, failed: 0 }))
      .toEqual({ imported: 70, failed: 2, remaining: 28, done: 72, total: 100, percent: 72 });
    expect(runProgress({ imported: 40, failed: 3, ready: 10 }, { imported: 10, failed: 1 }))
      .toEqual({ imported: 30, failed: 2, remaining: 10, done: 32, total: 42, percent: 76 });
  });

  it('el avance parte en 0, llega a 100 y nunca es negativo ni divide por cero', () => {
    expect(runProgress({ ready: 100 }, { imported: 0, failed: 0 }).percent).toBe(0);
    expect(runProgress({ imported: 5, ready: 0 }, { imported: 0, failed: 0 }).percent).toBe(100);
    expect(runProgress({}, { imported: 0, failed: 0 })).toEqual({ imported: 0, failed: 0, remaining: 0, done: 0, total: 0, percent: 0 });
    expect(runProgress({ imported: 1 }, { imported: 5, failed: 0 }).imported).toBe(0);
  });

  it('formatea el tiempo transcurrido como mm:ss y h:mm:ss', () => {
    expect(formatElapsed(0)).toBe('00:00');
    expect(formatElapsed(42_000)).toBe('00:42');
    expect(formatElapsed(125_000)).toBe('02:05');
    expect(formatElapsed(3_725_000)).toBe('1:02:05');
    expect(formatElapsed(-500)).toBe('00:00');
  });

  it('detecta un conteo estancado según el límite', () => {
    expect(isStalled(1_000, 1_000 + STALL_MS - 1, STALL_MS)).toBe(false);
    expect(isStalled(1_000, 1_000 + STALL_MS, STALL_MS)).toBe(true);
    expect(STALL_MS).toBe(45_000);
  });
});
