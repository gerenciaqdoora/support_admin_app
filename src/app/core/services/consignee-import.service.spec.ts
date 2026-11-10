import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ConsigneeImportService } from './consignee-import.service';

describe('ConsigneeImportService', () => {
  function setup() {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    return { api: TestBed.inject(ConsigneeImportService), http: TestBed.inject(HttpTestingController) };
  }
  const base = '/api/v1/support/companies/5/aduana/consignee-import';

  it('crea la sesión en multipart con encabezados en JSON', () => {
    const { api, http } = setup();
    const file = new File(['x'], 'clientes.xls');
    api.createSession(5, file, { signature: 'LISTADO DE CLIENTES', headers: { B: 'CODIGO' }, rows: [{ row_number: 4, columns: {} }], errors: [], inactive: 0 }, true).subscribe();

    const req = http.expectOne(`${base}/session`);
    const body = req.request.body as FormData;
    expect(body.get('column_headers')).toBe('{"B":"CODIGO"}');
    expect(body.get('total_rows')).toBe('1');
    expect(body.get('replace')).toBe('1');
    expect(body.get('format_code')).toBe('SIGAD_CLIENTES_V1');
    req.flush({ data: { id: 1 } });
  });

  it('lista filas con filtros y verifica en bloque', () => {
    const { api, http } = setup();
    api.listItems(5, 9, { status: 'pending', issue: 'BROKEN_CHARACTERS', page: 1, size: 50 }).subscribe();
    const list = http.expectOne((r) => r.url === `${base}/session/9/items`);
    expect(list.request.params.get('issue')).toBe('BROKEN_CHARACTERS');
    expect(list.request.params.get('page')).toBe('1');
    expect(list.request.params.has('search')).toBe(false);
    list.flush({ data: { records: [], pagination: {} } });

    api.bulkVerify(5, 9, 'BROKEN_CHARACTERS', [1, 2]).subscribe();
    expect(http.expectOne(`${base}/session/9/items/verify`).request.body).toEqual({ warning_code: 'BROKEN_CHARACTERS', item_ids: [1, 2] });
  });
});
