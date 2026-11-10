import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { ParsedSigadFile, ParsedSigadRow } from '../models/consignee-import.model';
import { SIGAD_CLIENTES_V1, normalizeHeader } from '../imports/sigad-clientes-v1';

const MAX_BYTES = 10 * 1024 * 1024;

/** Lee el "Listado de clientes" de SIGAD en el navegador y valida el formato SIGAD_CLIENTES_V1. */
@Injectable({ providedIn: 'root' })
export class ConsigneeImportParserService {
  async parse(file: File): Promise<ParsedSigadFile> {
    if (!/\.(xls|xlsx)$/i.test(file.name)) return this.fail('El archivo debe ser .xls o .xlsx.');
    if (file.size > MAX_BYTES) return this.fail('El archivo supera los 10 MB.');

    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) return this.fail('El archivo no contiene hojas.');

    return this.fromMatrix(XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: null }));
  }

  /** Separado de parse() para probarlo sin archivos. */
  fromMatrix(matrix: unknown[][]): ParsedSigadFile {
    const f = SIGAD_CLIENTES_V1;
    const cell = (row: number, col: string) => matrix[row]?.[XLSX.utils.decode_col(col)];
    const columns = Object.keys(f.headers);

    const signature = Array.from(matrix[f.signatureRow - 1] ?? [], (v) => normalizeHeader(v)).find((v) => v.includes(f.signature)) ?? '';
    const headers = Object.fromEntries(columns.map((col) => [col, String(cell(f.headerRow - 1, col) ?? '')]));

    const errors: string[] = [];
    if (!signature) {
      errors.push('El archivo no es un "Listado de clientes" de SIGAD: falta el título LISTADO DE CLIENTES en la fila 2.');
    }
    for (const col of columns) {
      const found = normalizeHeader(headers[col]);
      if (found !== f.headers[col]) errors.push(`Columna ${col}: se esperaba ${f.headers[col]} y se encontró ${found || '(vacía)'}.`);
    }

    const rows: ParsedSigadRow[] = [];
    let inactive = 0;
    if (errors.length === 0) {
      for (let r = f.firstDataRow - 1; r < matrix.length; r++) {
        if (!String(cell(r, 'B') ?? '').trim()) continue;
        const values = Object.fromEntries(columns.map((col) => {
          const v = cell(r, col);
          return [col, v === null || v === undefined ? null : String(v)];
        }));
        if (String(values['AI'] ?? '').trim().toUpperCase() === 'N') inactive++;
        rows.push({ row_number: r + 1, columns: values });
      }
      if (rows.length === 0) errors.push('El archivo no contiene filas de clientes bajo los encabezados.');
    }

    return { signature, headers, rows, errors, inactive };
  }

  /** Formato de ejemplo: título y encabezados en sus celdas exactas, sin datos. */
  buildExampleWorkbook(): ArrayBuffer {
    const f = SIGAD_CLIENTES_V1;
    const width = XLSX.utils.decode_col('CN') + 1;
    const row = (values: Record<string, string>) => {
      const r: (string | null)[] = Array(width).fill(null);
      for (const [col, v] of Object.entries(values)) r[XLSX.utils.decode_col(col)] = v;
      return r;
    };
    const sheet = XLSX.utils.aoa_to_sheet([row({ I: 'Sistema de Contabilidad General' }), row({ I: f.signature }), row(f.headers)]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, 'sigad');
    return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  }

  buildExampleFile(): Blob {
    return new Blob([this.buildExampleWorkbook()], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  private fail(message: string): ParsedSigadFile {
    return { signature: '', headers: {}, rows: [], errors: [message], inactive: 0 };
  }
}
