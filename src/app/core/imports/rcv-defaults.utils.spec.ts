import { describe, expect, it } from 'vitest';
import { RcvDefaultRun } from '../models/rcv-defaults.model';
import { applyLabel, defaultsStatus, isRunActive, pendingCount, runSummary } from './rcv-defaults.utils';

const run = (p: Partial<RcvDefaultRun>): RcvDefaultRun => ({
  run_id: 1, operation: 'purchase', mode: 'only_missing', status: 'running',
  total: 10, applied: 0, skipped: 0, failed: 0, percent: 0, errors: [], started_at: null, finished_at: null, ...p,
});

describe('rcv-defaults.utils', () => {
  it('defaultsStatus distingue ninguno, parcial y completo (solo compra)', () => {
    expect(defaultsStatus([])).toBe('none');
    expect(defaultsStatus([{ purpose: 'rcv_default_purchase_affected' }])).toBe('partial');
    expect(defaultsStatus([{ purpose: 'rcv_default_purchase_affected' }, { purpose: 'rcv_default_purchase_exempt' }])).toBe('complete');
  });

  it('defaultsStatus ignora los defaults de la otra operación', () => {
    const sale = [{ purpose: 'rcv_default_sale_affected' }, { purpose: 'rcv_default_sale_exempt' }];
    expect(defaultsStatus(sale)).toBe('none');
    expect(defaultsStatus(sale, 'sale')).toBe('complete');
  });

  it('isRunActive solo para queued y running', () => {
    expect(isRunActive(run({ status: 'queued' }))).toBe(true);
    expect(isRunActive(run({ status: 'running' }))).toBe(true);
    expect(isRunActive(run({ status: 'done' }))).toBe(false);
    expect(isRunActive(run({ status: 'failed' }))).toBe(false);
  });

  it('runSummary cuenta cuentas configuradas, sin cambios y con error', () => {
    expect(runSummary(run({ status: 'done', applied: 7, skipped: 2, failed: 1 }))).toBe('7 cuentas configuradas · 2 sin cambios · 1 con error');
    expect(runSummary(run({ status: 'done', applied: 3, failed: 0 }))).toBe('3 cuentas configuradas · 0 sin cambios · 0 con error');
    expect(runSummary(run({ status: 'done', applied: 1 }))).toBe('1 cuenta configurada · 0 sin cambios · 0 con error');
  });

  it('pendingCount suma lo que falta crear de afecta y exenta, tolerando nulos', () => {
    expect(pendingCount(null)).toBe(0);
    expect(pendingCount({ total_auxiliares: 5, affected: { a_crear: 3, a_reemplazar: 0, sin_cambios: 2 }, exempt: null })).toBe(3);
    expect(pendingCount({
      total_auxiliares: 5,
      affected: { a_crear: 3, a_reemplazar: 0, sin_cambios: 2 },
      exempt: { a_crear: 4, a_reemplazar: 0, sin_cambios: 1 },
    })).toBe(4);
  });

  it('applyLabel arma el texto del botón con el conteo', () => {
    expect(applyLabel(0)).toBe('No hay proveedores por configurar');
    expect(applyLabel(1)).toBe('Aplicar a 1 proveedor sin configuración');
    expect(applyLabel(1234)).toBe('Aplicar a 1.234 proveedores sin configuración');
    expect(applyLabel(1, 'sale')).toBe('Aplicar a 1 consignatario sin configuración');
    expect(applyLabel(0, 'sale')).toBe('No hay consignatarios por configurar');
  });
});
