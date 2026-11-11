import { EmployeeImportParserService } from './employee-import-parser.service';

describe('EmployeeImportParserService', () => {
  const parser = new EmployeeImportParserService();

  it('lee la hoja Empleados y firma el formato EMPLEADOS_V1', () => {
    const result = parser.fromMatrix([
      ['Código', 'RUT', 'Nombre', 'Cuenta mayor'],
      ['30050', '16104588-8', 'AARON MARTINEZ', '2101002'],
      ['30013', '', 'APERTURA PERIODO ANT.', '2101002'],
    ]);

    expect(result.errors).toEqual([]);
    expect(result.signature).toBe('EMPLEADOS_V1');
    expect(result.rows).toEqual([
      { row_number: 2, columns: { code: '30050', rut: '16104588-8', name: 'AARON MARTINEZ', account_code: '2101002' } },
      { row_number: 3, columns: { code: '30013', rut: null, name: 'APERTURA PERIODO ANT.', account_code: '2101002' } },
    ]);
  });

  it('rechaza una planilla sin filas con el texto de empleados', () => {
    expect(parser.fromMatrix([['Código', 'RUT', 'Nombre']]).errors).toEqual(['El archivo no contiene empleados bajo los encabezados.']);
  });

  it('la plantilla vacía se genera', () => {
    expect(parser.buildTemplateFile().size).toBeGreaterThan(0);
  });
});
