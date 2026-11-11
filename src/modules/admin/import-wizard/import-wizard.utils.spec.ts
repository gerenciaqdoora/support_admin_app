import { openLabel, progressPercent, statusClass, statusLabel, stepLink } from './import-wizard.utils';

describe('import-wizard.utils', () => {
  it('traduce los estados', () => {
    expect(statusLabel('pending')).toBe('Pendiente');
    expect(statusLabel('in_progress')).toBe('En curso');
    expect(statusLabel('completed')).toBe('Completado');
    expect(statusLabel('not_applicable')).toBe('No aplica');
  });

  it('da una clase de color distinta por estado', () => {
    const classes = (['pending', 'in_progress', 'completed', 'not_applicable'] as const).map(statusClass);
    expect(new Set(classes).size).toBe(4);
  });

  it('arma la ruta del paso o devuelve null si el portal no la conoce', () => {
    expect(stepLink('consignees', 5)).toEqual(['/admin/consignee-import', 5]);
    expect(stepLink('desconocido', 5)).toBeNull();
  });

  it('rotula la acción principal según el estado', () => {
    expect(openLabel('pending')).toBe('Iniciar');
    expect(openLabel('in_progress')).toBe('Continuar');
    expect(openLabel('completed')).toBe('Volver a abrir');
    expect(openLabel('not_applicable')).toBe('Abrir');
  });

  it('calcula el porcentaje de avance sin dividir por cero', () => {
    expect(progressPercent({ completed: 1, total: 4 })).toBe(25);
    expect(progressPercent({ completed: 0, total: 0 })).toBe(0);
  });

  it('el paso employees lleva a la importación de empleados', () => {
    expect(stepLink('employees', 5)).toEqual(['/admin/employee-import', 5]);
  });

  it('el paso providers lleva a la importación de proveedores', () => {
    expect(stepLink('providers', 5)).toEqual(['/admin/supplier-import', 5]);
  });
});
