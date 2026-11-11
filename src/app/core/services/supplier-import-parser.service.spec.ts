import { SupplierImportParserService } from './supplier-import-parser.service';

describe('SupplierImportParserService', () => {
  const parser = new SupplierImportParserService();

  it('lee la hoja Proveedores con encabezados en la fila 1 y salta filas vacías', () => {
    const result = parser.fromMatrix([
      ['Código', 'RUT', 'Nombre', 'Cuenta mayor'],
      ['1448', '76.123.456-0', 'ACME SPA', '2101001'],
      [null, null, null, null],
      ['1449', '', 'BETA LTDA', '2101001'],
    ]);

    expect(result.errors).toEqual([]);
    expect(result.signature).toBe('PROVEEDORES_V1');
    expect(result.rows).toEqual([
      { row_number: 2, columns: { code: '1448', rut: '76.123.456-0', name: 'ACME SPA', account_code: '2101001' } },
      { row_number: 4, columns: { code: '1449', rut: null, name: 'BETA LTDA', account_code: '2101001' } },
    ]);
  });

  it('acepta que falte la columna Cuenta mayor', () => {
    const result = parser.fromMatrix([['codigo', 'rut', 'NOMBRE'], ['1', '1-9', 'X']]);
    expect(result.errors).toEqual([]);
    expect(result.rows[0].columns['account_code']).toBeNull();
  });

  it('informa los encabezados que faltan', () => {
    const result = parser.fromMatrix([['Código', 'Nombre'], ['1', 'X']]);
    expect(result.errors).toEqual(['Falta la columna RUT.']);
  });

  it('rechaza una planilla sin filas', () => {
    expect(parser.fromMatrix([['Código', 'RUT', 'Nombre']]).errors).toEqual(['El archivo no contiene proveedores bajo los encabezados.']);
  });
});
