import { ImportStep, ImportStepStatus } from '@core/models/import-wizard.model';
import {
  bucketClass, bucketLabel, countByStatus, dependencyTitles, filterSteps, nextStep, openLabel, progressPercent,
  paginate, segmentWidth, statusClass, statusLabel, stepBucket, stepLink, summaryText,
} from './import-wizard.utils';

const mk = (code: string, order: number, status: ImportStepStatus, blocked = false, dependsOn: string[] = []): ImportStep => ({
  code, order, title: `Paso ${code}`, description: '', status, depends_on: dependsOn,
  blocked, blocked_reason: blocked ? 'Falta un paso previo.' : null, summary: null,
});

const DOCE: ImportStep[] = [
  mk('a', 1, 'completed'), mk('b', 2, 'completed'), mk('c', 3, 'not_applicable'), mk('d', 4, 'in_progress'),
  mk('e', 5, 'pending'), mk('f', 6, 'pending', true, ['e']), mk('g', 7, 'in_progress', true, ['e']),
  mk('h', 8, 'pending'), mk('i', 9, 'pending'), mk('j', 10, 'pending'), mk('k', 11, 'completed', true), mk('l', 12, 'pending'),
];

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

  it('el paso issuers lleva a la importación de emisores', () => {
    expect(stepLink('issuers', 5)).toEqual(['/admin/issuer-import', 5]);
  });

  it('el paso providers lleva a la importación de proveedores', () => {
    expect(stepLink('providers', 5)).toEqual(['/admin/supplier-import', 5]);
  });

  it('clasifica cada paso en un solo grupo: resuelto gana sobre bloqueado', () => {
    expect(stepBucket(mk('x', 1, 'completed', true))).toBe('completed');
    expect(stepBucket(mk('x', 1, 'not_applicable', true))).toBe('not_applicable');
    expect(stepBucket(mk('x', 1, 'in_progress', true))).toBe('blocked');
    expect(stepBucket(mk('x', 1, 'pending', true))).toBe('blocked');
    expect(stepBucket(mk('x', 1, 'in_progress'))).toBe('in_progress');
    expect(stepBucket(mk('x', 1, 'pending'))).toBe('pending');
  });

  it('cuenta por grupo y los grupos suman el total', () => {
    const c = countByStatus(DOCE);
    expect(c).toEqual({ all: 12, pending: 5, in_progress: 1, completed: 3, not_applicable: 1, blocked: 2 });
    expect(c.pending + c.in_progress + c.completed + c.not_applicable + c.blocked).toBe(c.all);
  });

  it('filtra por grupo y "all" devuelve todo en orden', () => {
    expect(filterSteps(DOCE, 'all').map((s) => s.code)).toEqual(DOCE.map((s) => s.code));
    expect(filterSteps(DOCE, 'blocked').map((s) => s.code)).toEqual(['f', 'g']);
    expect(filterSteps(DOCE, 'completed').map((s) => s.code)).toEqual(['a', 'b', 'k']);
    expect(filterSteps([], 'pending')).toEqual([]);
  });

  it('el siguiente paso es el primero por orden que está pendiente o en curso y no bloqueado', () => {
    expect(nextStep(DOCE)?.code).toBe('d');
    expect(nextStep([mk('a', 2, 'pending'), mk('b', 1, 'pending')])?.code).toBe('b');
    expect(nextStep([mk('a', 1, 'pending', true), mk('b', 2, 'completed')])).toBeNull();
    expect(nextStep([])).toBeNull();
  });

  it('traduce los códigos de dependencia a títulos y deja el código si no existe', () => {
    const step = mk('z', 9, 'pending', true, ['e', 'zz']);
    expect(dependencyTitles(step, DOCE)).toEqual(['Paso e', 'zz']);
    expect(dependencyTitles(mk('x', 1, 'pending'), DOCE)).toEqual([]);
  });

  it('resume la última ejecución o muestra guion', () => {
    expect(summaryText({ ...mk('x', 1, 'completed'), summary: { imported: 73, failed: 0, last_at: null } })).toBe('73 importadas');
    expect(summaryText({ ...mk('x', 1, 'completed'), summary: { imported: 70, failed: 3, last_at: null } })).toBe('70 importadas · 3 fallidas');
    expect(summaryText(mk('x', 1, 'pending'))).toBe('—');
  });

  it('rotula y colorea el grupo bloqueado además de los estados', () => {
    expect(bucketLabel('blocked')).toBe('Bloqueado');
    expect(bucketLabel('in_progress')).toBe('En curso');
    expect(new Set((['pending', 'in_progress', 'completed', 'not_applicable', 'blocked'] as const).map(bucketClass)).size).toBe(5);
  });

  it('calcula el ancho de cada tramo de la barra sin dividir por cero', () => {
    expect(segmentWidth(3, 12)).toBe(25);
    expect(segmentWidth(1, 0)).toBe(0);
  });

  it('pagina localmente con los mismos campos que el resto de las tablas del portal', () => {
    const p = paginate(DOCE, 0, 10);
    expect(p.records.map((s) => s.code)).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']);
    expect(p.pagination).toEqual({ length: 12, size: 10, page: 0, lastPage: 1, startIndex: 1, endIndex: 10 });

    const second = paginate(DOCE, 1, 10);
    expect(second.records.map((s) => s.code)).toEqual(['k', 'l']);
    expect(second.pagination).toMatchObject({ page: 1, startIndex: 11, endIndex: 12 });
  });

  it('ajusta la página fuera de rango y maneja la lista vacía', () => {
    expect(paginate(DOCE, 9, 10).pagination.page).toBe(1);
    expect(paginate(DOCE, -3, 10).pagination.page).toBe(0);
    expect(paginate([], 0, 10)).toEqual({ records: [], pagination: { length: 0, size: 10, page: 0, lastPage: 0, startIndex: 0, endIndex: 0 } });
  });
});
