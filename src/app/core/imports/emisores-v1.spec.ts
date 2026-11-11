import { EMISORES_V1 } from './emisores-v1';
import { PROVEEDORES_V1 } from './proveedores-v1';

describe('EMISORES_V1', () => {
  it('comparte columnas con proveedores y tiene su propio código y hoja', () => {
    expect(EMISORES_V1.code).toBe('EMISORES_V1');
    expect(EMISORES_V1.sheetName).toBe('Emisores');
    expect(EMISORES_V1.headers).toEqual(PROVEEDORES_V1.headers);
    expect(EMISORES_V1.required).toEqual(['code', 'rut', 'name']);
  });
});
