import * as XLSX from 'xlsx';
import { ConsigneeImportParserService } from './consignee-import-parser.service';
import { SIGAD_CLIENTES_V1 } from '../imports/sigad-clientes-v1';

function matriz(override: Record<string, string> = {}, datos: Record<string, string>[] = [{ B: '76123456', E: '76123456-0', AI: 'S' }]): unknown[][] {
  const fila = (valores: Record<string, string>) => {
    const r: unknown[] = [];
    for (const [col, v] of Object.entries(valores)) r[XLSX.utils.decode_col(col)] = v;
    return r;
  };
  return [
    fila({ I: 'Sistema de Contabilidad General' }),
    fila({ I: 'LISTADO DE CLIENTES' }),
    fila({ ...SIGAD_CLIENTES_V1.headers, H: ' COD. \nCOMUNA', ...override }),
    ...datos.map((d) => fila({ ...d, AX: 'contacto que no se envía' })),
  ];
}

describe('ConsigneeImportParserService', () => {
  const parser = new ConsigneeImportParserService();

  it('acepta el formato y envía solo las columnas con destino', () => {
    const r = parser.fromMatrix(matriz());
    expect(r.errors).toEqual([]);
    expect(r.rows).toHaveLength(1);
    expect(r.rows[0].row_number).toBe(4);
    expect(Object.keys(r.rows[0].columns)).toEqual(Object.keys(SIGAD_CLIENTES_V1.headers));
  });

  it('informa la columna movida', () => {
    const r = parser.fromMatrix(matriz({ H: 'CIUDAD' }));
    expect(r.errors).toContain('Columna H: se esperaba COD. COMUNA y se encontró CIUDAD.');
    expect(r.rows).toEqual([]);
  });

  it('exige la firma y al menos una fila', () => {
    const sinFirma = matriz();
    sinFirma[1] = [];
    expect(parser.fromMatrix(sinFirma).errors[0]).toContain('LISTADO DE CLIENTES');
    expect(parser.fromMatrix(matriz({}, [])).errors).toContain('El archivo no contiene filas de clientes bajo los encabezados.');
  });

  it('cuenta las filas inactivas', () => {
    expect(parser.fromMatrix(matriz({}, [{ B: '1', AI: 'N' }, { B: '2', AI: 'S' }])).inactive).toBe(1);
  });

  it('el formato de ejemplo se lee como el formato aceptado, sin datos', () => {
    const wb = XLSX.read(parser.buildExampleWorkbook(), { type: 'array' });
    const m = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false, defval: null });
    expect(parser.fromMatrix(m).errors).toEqual(['El archivo no contiene filas de clientes bajo los encabezados.']);
  });
});
