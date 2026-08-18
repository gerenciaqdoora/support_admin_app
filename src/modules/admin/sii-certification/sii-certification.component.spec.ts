import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { SiiCertificationComponent } from './sii-certification.component';
import { CertificationOverview, SiiAdminService } from '@core/services/sii-admin.service';

function overviewFixture(partial: Partial<CertificationOverview> = {}): CertificationOverview {
  return {
    processes: {
      documentos: {
        steps: [
          { step_key: 'postulacion', kind: 'manual', status: 'pending' },
          { step_key: 'certificado', kind: 'computed', status: 'done' },
          { step_key: 'caf', kind: 'computed', status: 'done' },
          { step_key: 'set_pruebas', kind: 'computed', status: 'pending', cases_total: 0, cases_accepted: 0 },
          { step_key: 'simulacion', kind: 'manual', status: 'pending' },
          { step_key: 'intercambio', kind: 'manual', status: 'pending' },
          { step_key: 'muestras_impresas', kind: 'manual', status: 'pending' },
          { step_key: 'declaracion', kind: 'manual', status: 'pending' },
        ],
        cases: [],
        applicable: true,
      },
      boleta: { steps: [], cases: [], applicable: false },
    },
    read_only: false,
    onboarding_path: 'certificacion',
    certification_scope: ['documentos'],
    ...partial,
  };
}

function setup(overview: CertificationOverview, environment = 'certificacion') {
  const service = {
    getCertification: () => of(overview),
    getEnvironment: () => of({ data: { sii_environment: environment } }),
  };

  TestBed.configureTestingModule({
    imports: [SiiCertificationComponent],
    providers: [
      provideRouter([]),
      { provide: SiiAdminService, useValue: service },
      { provide: ActivatedRoute, useValue: { snapshot: { params: { companyId: '7' } } } },
    ],
  });

  const fixture = TestBed.createComponent(SiiCertificationComponent);
  fixture.detectChanges();

  return fixture;
}

describe('SiiCertificationComponent', () => {
  it('muestra el checklist de 8 pasos de la vía certificación completa', () => {
    const fixture = setup(overviewFixture());

    expect(fixture.componentInstance.steps().length).toBe(8);
    expect(fixture.componentInstance.isEnsayo()).toBe(false);
  });

  it('rotula set_pruebas como Ensayo técnico en la vía emisor existente', () => {
    const overview = overviewFixture({
      onboarding_path: 'emisor_existente',
      processes: {
        documentos: {
          steps: [
            { step_key: 'certificado', kind: 'computed', status: 'done' },
            { step_key: 'caf', kind: 'computed', status: 'done' },
            {
              step_key: 'set_pruebas',
              kind: 'computed',
              status: 'in_progress',
              cases_total: 1,
              cases_accepted: 0,
              expected_codes: ['33', '61'],
              missing_codes: ['61'],
            },
            { step_key: 'resolucion_vigente', kind: 'manual', status: 'pending' },
          ],
          cases: [],
          applicable: true,
        },
        boleta: { steps: [], cases: [], applicable: false },
      },
    });
    const fixture = setup(overview);
    const component = fixture.componentInstance;

    expect(component.steps().length).toBe(4);
    expect(component.stepLabel(component.steps()[2])).toBe('Ensayo técnico');
  });

  it('bloquea la habilitación de producción mientras haya pasos pendientes', () => {
    const fixture = setup(overviewFixture());

    expect(fixture.componentInstance.canPromote()).toBe(false);
    expect(fixture.componentInstance.pendingSteps()).toContain('documentos.postulacion');
  });

  it('ignora los pasos de un proceso fuera de alcance al evaluar producción', () => {
    const overview = overviewFixture();
    overview.processes.documentos.steps = overview.processes.documentos.steps.map((step) => ({
      ...step,
      status: 'done' as const,
    }));
    overview.processes.boleta = {
      steps: [{ step_key: 'postulacion', kind: 'manual', status: 'pending' }],
      cases: [],
      applicable: false,
    };

    const fixture = setup(overview);

    expect(fixture.componentInstance.pendingSteps()).toEqual([]);
    expect(fixture.componentInstance.canPromote()).toBe(true);
  });

  it('queda en solo lectura cuando la empresa ya está en producción', () => {
    const fixture = setup(overviewFixture({ read_only: true }), 'produccion');

    expect(fixture.componentInstance.readOnly()).toBe(true);
    expect(fixture.componentInstance.canPromote()).toBe(false);
    expect(fixture.componentInstance.inProduction()).toBe(true);
  });

  it('vincula la Factura de Compra por doc_purchase_id y el resto por doc_sale_id', () => {
    const fixture = setup(overviewFixture());
    const component = fixture.componentInstance;

    expect(component.isPurchaseCase({ dte_type_code: '46' } as never)).toBe(true);
    expect(component.isPurchaseCase({ dte_type_code: '33' } as never)).toBe(false);
  });
});
