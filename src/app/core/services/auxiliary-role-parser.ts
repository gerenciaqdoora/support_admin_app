import * as XLSX from 'xlsx';
import { ParsedSigadFile, ParsedSigadRow } from '../models/consignee-import.model';
import { ListFormat, normalizeHeader } from '../imports/proveedores-v1';

const MAX_BYTES = 10 * 1024 * 1024;

/** Textos propios del rol en el lector y en la plantilla. */
export interface RoleParserTexts { plural: string; singular: string; master: string; nameHelp: string; }

/** Lee en el navegador la plantilla de un rol (proveedores, empleados…) y valida su formato amigable. */
export class AuxiliaryRoleParser {
  constructor(private readonly format: ListFormat, private readonly texts: RoleParserTexts) {}

  async parse(file: File): Promise<ParsedSigadFile> {
    if (!/\.(xls|xlsx)$/i.test(file.name)) return this.fail('El archivo debe ser .xls o .xlsx.');
    if (file.size > MAX_BYTES) return this.fail('El archivo supera los 10 MB.');

    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    const sheet = workbook.Sheets[this.format.sheetName] ?? workbook.Sheets[workbook.SheetNames[0]];
    if (!sheet) return this.fail('El archivo no contiene hojas.');

    return this.fromMatrix(XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: null }));
  }

  /** Separado de parse() para probarlo sin archivos. */
  fromMatrix(matrix: unknown[][]): ParsedSigadFile {
    const f = this.format;
    const headerCells = (matrix[f.headerRow - 1] ?? []).map((v) => String(v ?? ''));
    const position: Record<string, number> = {};
    for (const [key, expected] of Object.entries(f.headers)) {
      const index = headerCells.findIndex((h) => normalizeHeader(h) === expected);
      if (index >= 0) position[key] = index;
    }

    const headers = Object.fromEntries(Object.entries(position).map(([key, i]) => [key, headerCells[i]]));
    const errors = f.required.filter((key) => !(key in position)).map((key) => `Falta la columna ${f.labels[key]}.`);

    const rows: ParsedSigadRow[] = [];
    if (errors.length === 0) {
      for (let r = f.firstDataRow - 1; r < matrix.length; r++) {
        const values = Object.fromEntries(Object.keys(f.headers).map((key) => {
          const raw = key in position ? matrix[r]?.[position[key]] : null;
          const text = raw === null || raw === undefined ? '' : String(raw).trim();
          return [key, text === '' ? null : text];
        }));
        if (Object.values(values).every((v) => v === null)) continue;
        rows.push({ row_number: r + 1, columns: values });
      }
      if (rows.length === 0) errors.push(`El archivo no contiene ${this.texts.plural} bajo los encabezados.`);
    }

    return { signature: errors.length === 0 ? f.code : '', headers, rows, errors, inactive: 0 };
  }

  /** Plantilla vacía: hoja del rol con los encabezados y hoja de instrucciones. */
  buildTemplateWorkbook(): ArrayBuffer {
    const f = this.format;
    const t = this.texts;
    const sheet = XLSX.utils.aoa_to_sheet([Object.keys(f.headers).map((k) => f.labels[k])]);
    sheet['!cols'] = [{ wch: 10 }, { wch: 14 }, { wch: 48 }, { wch: 14 }];
    const help = XLSX.utils.aoa_to_sheet([
      [`Importación de ${t.plural} · formato ${f.code}`], [''],
      [`Hoja «${f.sheetName}», encabezados en la fila 1 (no cambiar los nombres):`],
      ['Código', `Obligatorio. Código SIGAD del ${t.singular}. No puede repetirse.`],
      ['RUT', 'Obligatorio. Formato 12345678-9. Si falta, el portal busca fichas existentes por nombre; si no hay, se escribe en el portal.'],
      ['Nombre', `Obligatorio. ${t.nameHelp}`],
      ['Cuenta mayor', `Opcional. Si viene, debe coincidir con la cuenta maestra ${t.master} de la empresa.`],
    ]);
    help['!cols'] = [{ wch: 16 }, { wch: 110 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, sheet, f.sheetName);
    XLSX.utils.book_append_sheet(wb, help, 'Instrucciones');
    return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  }

  buildTemplateFile(): Blob {
    return new Blob([this.buildTemplateWorkbook()], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  private fail(message: string): ParsedSigadFile {
    return { signature: '', headers: {}, rows: [], errors: [message], inactive: 0 };
  }
}
