import { accountWarning } from './account-warning';
import { AccountCheck } from '@core/models/supplier-import.model';

const base: AccountCheck = {
  master: { code: '2101002', display_code: '2101002', name: 'PROVEEDORES', node_type: 'subcuenta' },
  file_codes: ['2101001'], matches: false, can_reassign: true,
  target: { code: '2101001', name: 'PROVEEDORES NACIONALES', type: 'subcuenta' }, impact: { members_on_current_master: 3 },
};

describe('accountWarning', () => {
  it('no avisa si la cuenta coincide o el archivo no trae la columna', () => {
    expect(accountWarning({ ...base, matches: true }, 'Proveedor Nacional')).toBeNull();
    expect(accountWarning({ ...base, matches: null, file_codes: [] }, 'Proveedor Nacional')).toBeNull();
    expect(accountWarning(null, 'Proveedor Nacional')).toBeNull();
  });

  it('explica la diferencia y ofrece reasignar', () => {
    const w = accountWarning(base, 'Proveedor Nacional')!;
    expect(w.message).toBe('El archivo trae la cuenta mayor 2101001, pero la cuenta maestra Proveedor Nacional asignada es 2101002 (PROVEEDORES).');
    expect(w.actionLabel).toBe('Reasignar a 2101001');
  });

  it('avisa cuando la empresa no tiene maestra asignada', () => {
    expect(accountWarning({ ...base, master: null }, 'Proveedor Nacional')!.message).toBe('La empresa no tiene cuenta maestra Proveedor Nacional asignada y el archivo trae la cuenta mayor 2101001.');
    expect(accountWarning({ ...base, master: null, matches: null, file_codes: [], can_reassign: false, target: null }, 'Proveedor Nacional')!.message)
      .toBe('La empresa no tiene cuenta maestra Proveedor Nacional asignada: configúrela en el plan de cuentas o agregue la columna Cuenta mayor al archivo.');
  });

  it('explica por qué no se puede reasignar', () => {
    const w = accountWarning({ ...base, can_reassign: false, target: null }, 'Proveedor Nacional')!;
    expect(w.actionLabel).toBeNull();
    expect(w.hint).toBe('No se puede reasignar automáticamente: la cuenta del archivo no existe como cuenta mayor del plan o el archivo trae más de una cuenta.');
  });

  it('usa el nombre de la cuenta maestra del rol', () => {
    expect(accountWarning({ ...base, master: null }, 'Remuneraciones por Pagar')!.message)
      .toBe('La empresa no tiene cuenta maestra Remuneraciones por Pagar asignada y el archivo trae la cuenta mayor 2101001.');
  });
});
