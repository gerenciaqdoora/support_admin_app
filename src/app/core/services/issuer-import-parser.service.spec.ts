import { IssuerImportParserService } from './issuer-import-parser.service';

describe('IssuerImportParserService', () => {
  const parser = new IssuerImportParserService();

  it('lee la hoja Emisores y firma el formato EMISORES_V1', () => {
    const result = parser.fromMatrix([
      ['Código', 'RUT', 'Nombre', 'Cuenta mayor'],
      ['20147', '10448363-1', 'RENATA MARCELA GONZALEZ', '2101003'],
      ['20161', '', 'ALEXANDER ARTURO DIAZ DIAZ', '2101003'],
    ]);

    expect(result.errors).toEqual([]);
    expect(result.signature).toBe('EMISORES_V1');
    expect(result.rows).toEqual([
      { row_number: 2, columns: { code: '20147', rut: '10448363-1', name: 'RENATA MARCELA GONZALEZ', account_code: '2101003' } },
      { row_number: 3, columns: { code: '20161', rut: null, name: 'ALEXANDER ARTURO DIAZ DIAZ', account_code: '2101003' } },
    ]);
  });

  it('rechaza una planilla sin filas con el texto de emisores', () => {
    expect(parser.fromMatrix([['Código', 'RUT', 'Nombre']]).errors).toEqual(['El archivo no contiene emisores bajo los encabezados.']);
  });

  it('la plantilla vacía se genera', () => {
    expect(parser.buildTemplateFile().size).toBeGreaterThan(0);
  });
});
