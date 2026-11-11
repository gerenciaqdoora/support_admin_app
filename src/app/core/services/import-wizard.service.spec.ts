import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ImportWizardService } from './import-wizard.service';

describe('ImportWizardService', () => {
  const base = '/api/v1/support/companies/5/aduana/imports';
  const overview = { steps: [], progress: { completed: 0, total: 1 } };

  function setup() {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    return { api: TestBed.inject(ImportWizardService), http: TestBed.inject(HttpTestingController) };
  }

  it('consulta el catálogo y devuelve solo el contenido de data', () => {
    const { api, http } = setup();
    let result: unknown;
    api.overview(5).subscribe((r) => (result = r));
    const req = http.expectOne(`${base}`);
    expect(req.request.method).toBe('GET');
    req.flush({ data: overview, message: '' });
    expect(result).toEqual(overview);
  });

  it('marca y quita no aplica con PUT y DELETE', () => {
    const { api, http } = setup();
    api.markNotApplicable(5, 'consignees').subscribe();
    const put = http.expectOne(`${base}/steps/consignees/not-applicable`);
    expect(put.request.method).toBe('PUT');
    put.flush({ data: overview, message: '' });

    api.unmarkNotApplicable(5, 'consignees').subscribe();
    const del = http.expectOne(`${base}/steps/consignees/not-applicable`);
    expect(del.request.method).toBe('DELETE');
    del.flush({ data: overview, message: '' });
  });
});
