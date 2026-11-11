import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { EmployeeImportService } from './employee-import.service';

describe('EmployeeImportService', () => {
  function setup() {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    return { api: TestBed.inject(EmployeeImportService), http: TestBed.inject(HttpTestingController) };
  }
  const base = '/api/v1/support/companies/5/aduana/employee-import';

  it('lee los requisitos del endpoint de empleados', () => {
    const { api, http } = setup();
    let result: unknown;
    api.requirements(5).subscribe((r) => (result = r));
    http.expectOne(`${base}/requirements`).flush({ data: { ready: true, blockers: [] }, message: 'ok' });
    expect(result).toEqual({ ready: true, blockers: [] });
  });

  it('crea la sesión con el formato EMPLEADOS_V1', () => {
    const { api, http } = setup();
    api.createSession(5, new File(['x'], 'e.xlsx'), { signature: 'EMPLEADOS_V1', headers: { code: 'Código' }, rows: [], errors: [], inactive: 0 }, false).subscribe();
    const req = http.expectOne(`${base}/session`);
    expect((req.request.body as FormData).get('format_code')).toBe('EMPLEADOS_V1');
    req.flush({ data: {}, message: 'ok' });
  });

  it('reasigna la cuenta maestra desde la sesión', () => {
    const { api, http } = setup();
    api.reassignMasterAccount(5, 9).subscribe();
    const req = http.expectOne(`${base}/session/9/master-account`);
    expect(req.request.method).toBe('PUT');
    req.flush({ data: { id: 9 }, message: 'ok' });
  });
});
