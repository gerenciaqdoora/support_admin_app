import { EMPLEADOS_V1 } from './empleados-v1';
import { PROVEEDORES_V1 } from './proveedores-v1';

describe('EMPLEADOS_V1', () => {
  it('comparte columnas con proveedores y tiene su propio código y hoja', () => {
    expect(EMPLEADOS_V1.code).toBe('EMPLEADOS_V1');
    expect(EMPLEADOS_V1.sheetName).toBe('Empleados');
    expect(EMPLEADOS_V1.headers).toEqual(PROVEEDORES_V1.headers);
    expect(EMPLEADOS_V1.required).toEqual(['code', 'rut', 'name']);
  });
});
