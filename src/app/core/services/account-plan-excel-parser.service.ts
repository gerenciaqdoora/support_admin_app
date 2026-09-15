import { Injectable } from '@angular/core';
import * as XLSX from 'xlsx';
import { AccountPlanImportRow } from '../models/account-plan-import.model';

/**
 * Encabezados esperados en la hoja de cuentas del archivo del cliente.
 * Sin tilde a propósito: se comparan contra el resultado de normalize(), que
 * quita acentos antes de comparar.
 */
const HEADER_CODE = 'codigo cuenta';
const HEADER_NAME = 'descripcion cuenta';
const HEADER_SIGLA = 'sigla / analisis';
const HEADER_CLASS = 'clase cuenta';

export interface ExcelParseResult {
  rows: AccountPlanImportRow[];
  errors: string[];
}

@Injectable({ providedIn: 'root' })
export class AccountPlanExcelParserService {
  /**
   * Lee la primera hoja del archivo y devuelve las filas normalizadas.
   *
   * La interpretación de la jerarquía NO ocurre aquí: el parser solo entrega
   * el listado plano, y es el backend quien lo cruza con los largos. Así la
   * previsualización y la importación definitiva usan exactamente la misma
   * lógica de armado.
   */
  async parse(file: File): Promise<ExcelParseResult> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { rows: [], errors: ['El archivo no contiene hojas.'] };
    }

    const matrix: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      header: 1,
      raw: false,
      defval: '',
    });

    if (matrix.length <= 1) {
      return { rows: [], errors: ['La hoja no contiene datos bajo el encabezado.'] };
    }

    const header = matrix[0].map((cell) => this.normalize(cell));
    const codeIdx = header.indexOf(HEADER_CODE);
    const nameIdx = header.indexOf(HEADER_NAME);
    const siglaIdx = header.indexOf(HEADER_SIGLA);
    const classIdx = header.indexOf(HEADER_CLASS);

    if (codeIdx === -1 || nameIdx === -1) {
      return {
        rows: [],
        errors: [
          `No se encontraron las columnas obligatorias "Código Cuenta" y "Descripción Cuenta". Encabezados leídos: ${header.filter((h) => h).join(', ')}`,
        ],
      };
    }

    const rows: AccountPlanImportRow[] = [];
    const errors: string[] = [];

    for (let i = 1; i < matrix.length; i++) {
      const raw = matrix[i];
      const code = String(raw[codeIdx] ?? '').trim();
      const name = String(raw[nameIdx] ?? '').trim();
      const sigla = siglaIdx === -1 ? '' : String(raw[siglaIdx] ?? '').trim();
      const clase = classIdx === -1 ? '' : String(raw[classIdx] ?? '').trim();

      // Fila completamente vacía: fin de datos, no es un error
      if (!code && !name) continue;

      if (!code) {
        errors.push(`Fila ${i + 1}: falta el código de la cuenta.`);
        continue;
      }
      if (!name) {
        errors.push(`Fila ${i + 1}: falta la descripción de la cuenta "${code}".`);
        continue;
      }

      rows.push({ code, name, sigla: sigla ? sigla.toUpperCase() : null, class: clase || null });
    }

    return { rows, errors };
  }

  /** Minúsculas sin acentos, para comparar encabezados sin depender del tildado. */
  private normalize(value: any): string {
    return String(value ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, ' ');
  }
}
