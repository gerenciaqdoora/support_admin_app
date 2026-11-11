import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { SupplierImportService } from './supplier-import.service';

describe('SupplierImportService', () => {
  function setup() {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    return { api: TestBed.inject(SupplierImportService), http: TestBed.inject(HttpTestingController) };
  }
  const base = '/api/v1/support/companies/5/aduana/supplier-import';

  it('lee los requisitos del endpoint de proveedores', () => {
    const { api, http } = setup();
    let result: unknown;
    api.requirements(5).subscribe((r) => (result = r));
    http.expectOne(`${base}/requirements`).flush({ data: { ready: true, blockers: [] }, message: 'ok' });
    expect(result).toEqual({ ready: true, blockers: [] });
  });

  it('crea la sesión con el formato PROVEEDORES_V1', () => {
    const { api, http } = setup();
    const file = new File(['x'], 'p.xlsx');
    api.createSession(5, file, { signature: 'PROVEEDORES_V1', headers: { code: 'Código' }, rows: [], errors: [], inactive: 0 }, false).subscribe();
    const req = http.expectOne(`${base}/session`);
    const form = req.request.body as FormData;
    expect(form.get('format_code')).toBe('PROVEEDORES_V1');
    expect(form.get('column_headers')).toBe('{"code":"Código"}');
    req.flush({ data: {}, message: 'ok' });
  });

  it('reasigna la cuenta maestra desde la sesión', () => {
    const { api, http } = setup();
    let result: unknown;
    api.reassignMasterAccount(5, 9).subscribe((r) => (result = r));
    const req = http.expectOne(`${base}/session/9/master-account`);
    expect(req.request.method).toBe('PUT');
    req.flush({ data: { id: 9 }, message: 'ok' });
    expect(result).toEqual({ id: 9 });
  });

  it('actualiza una fila con la elección de nombre', () => {
    const { api, http } = setup();
    api.updateItem(5, 9, { code: '1', rut: '761234560', name: 'ACME', account_code: null, name_choice: 'replace' }).subscribe();
    const req = http.expectOne(`${base}/items/9`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.normalized.name_choice).toBe('replace');
    req.flush({ data: {}, message: 'ok' });
  });
});
