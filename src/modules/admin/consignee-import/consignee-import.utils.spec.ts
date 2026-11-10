import { chunkRows, statusLabel, totalOpen } from './consignee-import.utils';

describe('consignee-import.utils', () => {
  it('divide las filas en lotes de 500', () => {
    const rows = Array.from({ length: 1201 }, (_, i) => ({ row_number: i + 4, columns: {} }));
    expect(chunkRows(rows, 500).map((c) => c.length)).toEqual([500, 500, 201]);
  });

  it('suma las filas que aún no terminan y traduce estados', () => {
    expect(totalOpen({ pending: 3, edited: 1, ready: 2, failed: 1, imported: 9, skipped: 4 })).toBe(7);
    expect(statusLabel('failed')).toBe('Fallida');
  });
});
