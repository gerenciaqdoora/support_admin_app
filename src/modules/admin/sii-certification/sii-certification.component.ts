import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  CertificationCase,
  CertificationOverview,
  CertificationProcessType,
  CertificationStep,
  CertificationStepStatus,
  SiiAdminService,
  SiiOnboardingPath,
} from '@core/services/sii-admin.service';
import { NotificationService } from '@core/services/notification.service';

/** Códigos de DTE que el Set de Pruebas / ensayo puede cubrir. */
const DTE_TYPES: ReadonlyArray<{ code: string; label: string }> = [
  { code: '33', label: '33 · Factura Electrónica' },
  { code: '34', label: '34 · Factura Exenta' },
  { code: '39', label: '39 · Boleta Electrónica' },
  { code: '41', label: '41 · Boleta Exenta' },
  { code: '46', label: '46 · Factura de Compra' },
  { code: '52', label: '52 · Guía de Despacho' },
  { code: '56', label: '56 · Nota de Débito' },
  { code: '61', label: '61 · Nota de Crédito' },
  { code: '110', label: '110 · Factura de Exportación' },
  { code: '111', label: '111 · Nota de Débito Exportación' },
  { code: '112', label: '112 · Nota de Crédito Exportación' },
];

const STEP_LABELS: Readonly<Record<string, string>> = {
  postulacion: 'Postulación ante el SII',
  certificado: 'Certificado digital vigente',
  caf: 'Folios de certificación (CAF)',
  set_pruebas: 'Set de Pruebas',
  simulacion: 'Simulación de operaciones',
  intercambio: 'Intercambio de documentos',
  muestras_impresas: 'Muestras impresas',
  declaracion: 'Declaración de cumplimiento',
  resolucion_vigente: 'Resolución SII vigente',
};

/** Factura de Compra: la empresa emite como receptora, se vincula a una compra. */
const PURCHASE_CODE = '46';

/**
 * Asistente de certificación SII operado por Soporte para una empresa cliente.
 * Consume v1/support/companies/{id}/sii/certification*. La API garantiza que
 * ninguna emisión ocurra en producción; la UI solo refleja ese estado.
 */
@Component({
  selector: 'app-sii-certification',
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sii-certification.component.html',
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        overflow: hidden;
      }
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #e2e8f0;
        border-radius: 10px;
      }
    `,
  ],
})
export class SiiCertificationComponent {
  private _route = inject(ActivatedRoute);
  private _service = inject(SiiAdminService);
  private _notification = inject(NotificationService);
  private _fb = inject(FormBuilder);

  readonly dteTypes = DTE_TYPES;

  companyId = signal<number>(Number(this._route.snapshot.params['companyId']));
  overview = signal<CertificationOverview | null>(null);
  environment = signal<string>('certificacion');
  selectedProcess = signal<CertificationProcessType>('documentos');

  loading = signal(false);
  savingStep = signal<string | null>(null);
  emittingCaseId = signal<number | null>(null);
  linkingCaseId = signal<number | null>(null);
  deletingCaseId = signal<number | null>(null);
  creatingCase = signal(false);
  promoting = signal(false);
  emitFormCaseId = signal<number | null>(null);

  path = computed<SiiOnboardingPath>(() => this.overview()?.onboarding_path ?? 'certificacion');
  isEnsayo = computed(() => this.path() === 'emisor_existente');
  readOnly = computed(() => this.overview()?.read_only ?? false);
  emitsBoleta = computed(() => (this.overview()?.certification_scope ?? []).includes('boleta'));
  inProduction = computed(() => this.environment() === 'produccion');

  process = computed(() => this.overview()?.processes?.[this.selectedProcess()] ?? null);
  steps = computed<CertificationStep[]>(() => this.process()?.steps ?? []);
  cases = computed<CertificationCase[]>(() => this.process()?.cases ?? []);
  processApplicable = computed(() => this.process()?.applicable ?? true);

  /** Pasos pendientes de TODOS los procesos aplicables: lo que bloquea producción. */
  pendingSteps = computed<string[]>(() => {
    const data = this.overview();
    if (!data) return [];

    return Object.entries(data.processes).flatMap(([processKey, process]) =>
      process.applicable
        ? process.steps.filter((step) => step.status !== 'done').map((step) => `${processKey}.${step.step_key}`)
        : [],
    );
  });

  canPromote = computed(() => !this.readOnly() && this.pendingSteps().length === 0);

  newCaseForm = this._fb.nonNullable.group({
    attention_number: [''],
    case_number: [''],
    dte_type_code: ['33', Validators.required],
    description: ['', [Validators.required, Validators.maxLength(2000)]],
  });

  emitForm: FormGroup = this._fb.nonNullable.group({
    date: [new Date().toISOString().slice(0, 10)],
    items: this._fb.array([this.buildItem()]),
  });

  linkForm = this._fb.nonNullable.group({
    document_id: [null as number | null, [Validators.required, Validators.min(1)]],
  });

  promoteForm = this._fb.nonNullable.group({
    resolution_num: ['', [Validators.required, Validators.maxLength(20)]],
    resolution_date: ['', Validators.required],
    notes: [''],
  });

  rollbackReasonCtrl = this._fb.nonNullable.control('', [Validators.required, Validators.minLength(10)]);

  constructor() {
    this.reload();
  }

  get items(): FormArray<FormGroup> {
    return this.emitForm.get('items') as FormArray<FormGroup>;
  }

  private buildItem(): FormGroup {
    return this._fb.nonNullable.group({
      name: ['', [Validators.required, Validators.maxLength(80)]],
      quantity: [1, [Validators.required, Validators.min(0.0001)]],
      vr_unitary: [0, [Validators.required, Validators.min(0)]],
      is_exempt: [false],
    });
  }

  addItem(): void {
    this.items.push(this.buildItem());
  }

  removeItem(index: number): void {
    if (this.items.length > 1) this.items.removeAt(index);
  }

  reload(): void {
    this.loading.set(true);
    this._service
      .getCertification(this.companyId())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => this.overview.set(data),
        error: (err) => this._notification.error(this.messageOf(err, 'No se pudo cargar la certificación.')),
      });

    this._service.getEnvironment(this.companyId()).subscribe({
      next: (res) => this.environment.set(res?.data?.sii_environment ?? 'certificacion'),
      error: () => this._notification.error('No se pudo cargar el ambiente actual.'),
    });
  }

  selectProcess(process: CertificationProcessType): void {
    this.selectedProcess.set(process);
  }

  stepLabel(step: CertificationStep): string {
    if (step.step_key === 'set_pruebas' && this.isEnsayo()) return 'Ensayo técnico';

    return STEP_LABELS[step.step_key] ?? step.step_key;
  }

  stepStatusClass(status: CertificationStepStatus): string {
    switch (status) {
      case 'done':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'in_progress':
        return 'bg-amber-50 text-amber-600 border-amber-100';
      default:
        return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  }

  stepStatusLabel(status: CertificationStepStatus): string {
    const labels: Record<CertificationStepStatus, string> = {
      done: 'Completado',
      in_progress: 'En curso',
      pending: 'Pendiente',
    };

    return labels[status];
  }

  setStepStatus(step: CertificationStep, status: CertificationStepStatus): void {
    if (step.kind === 'computed' || this.readOnly()) return;

    this.savingStep.set(step.step_key);
    this._service
      .updateStep(this.companyId(), {
        process_type: this.selectedProcess(),
        step_key: step.step_key,
        status,
      })
      .pipe(finalize(() => this.savingStep.set(null)))
      .subscribe({
        next: () => this.reload(),
        error: (err) => this._notification.error(this.messageOf(err, 'No se pudo actualizar el paso.')),
      });
  }

  createCase(): void {
    if (this.newCaseForm.invalid) return;

    const raw = this.newCaseForm.getRawValue();
    this.creatingCase.set(true);
    this._service
      .storeCase(this.companyId(), {
        process_type: this.selectedProcess(),
        attention_number: raw.attention_number || null,
        case_number: raw.case_number || null,
        dte_type_code: raw.dte_type_code,
        description: raw.description,
      })
      .pipe(finalize(() => this.creatingCase.set(false)))
      .subscribe({
        next: () => {
          this._notification.success('Caso registrado correctamente.');
          this.newCaseForm.reset({ attention_number: '', case_number: '', dte_type_code: '33', description: '' });
          this.reload();
        },
        error: (err) => this._notification.error(this.messageOf(err, 'No se pudo registrar el caso.')),
      });
  }

  deleteCase(caseId: number): void {
    this.deletingCaseId.set(caseId);
    this._service
      .deleteCase(this.companyId(), caseId)
      .pipe(finalize(() => this.deletingCaseId.set(null)))
      .subscribe({
        next: () => {
          this._notification.success('Caso eliminado.');
          this.reload();
        },
        error: (err) => this._notification.error(this.messageOf(err, 'No se pudo eliminar el caso.')),
      });
  }

  openEmitForm(caseId: number): void {
    this.emitFormCaseId.set(caseId);
    this.items.clear();
    this.items.push(this.buildItem());
    this.emitForm.patchValue({ date: new Date().toISOString().slice(0, 10) });
  }

  closeEmitForm(): void {
    this.emitFormCaseId.set(null);
  }

  emitCase(caseId: number): void {
    if (this.emitForm.invalid) return;

    const raw = this.emitForm.getRawValue() as { date: string; items: Array<{ name: string; quantity: number; vr_unitary: number; is_exempt: boolean }> };

    this.emittingCaseId.set(caseId);
    this._service
      .emitCase(this.companyId(), caseId, { date: raw.date, items: raw.items })
      .pipe(finalize(() => this.emittingCaseId.set(null)))
      .subscribe({
        next: () => {
          this._notification.success('Documento de prueba creado. El envío al SII quedó encolado.');
          this.closeEmitForm();
          this.reload();
        },
        error: (err) => this._notification.error(this.messageOf(err, 'No se pudo emitir el documento de prueba.')),
      });
  }

  startLinking(caseId: number): void {
    this.linkingCaseId.set(caseId);
    this.linkForm.reset({ document_id: null });
  }

  /** Vincula un documento ya emitido: compra si es 46, venta en cualquier otro caso. */
  confirmLink(item: CertificationCase): void {
    if (this.linkForm.invalid) return;

    const documentId = this.linkForm.getRawValue().document_id;
    const payload =
      item.dte_type_code === PURCHASE_CODE ? { doc_purchase_id: documentId } : { doc_sale_id: documentId };

    this._service.updateCase(this.companyId(), item.id, payload).subscribe({
      next: () => {
        this._notification.success('Documento vinculado al caso.');
        this.linkingCaseId.set(null);
        this.reload();
      },
      error: (err) => this._notification.error(this.messageOf(err, 'No se pudo vincular el documento.')),
    });
  }

  cancelLink(): void {
    this.linkingCaseId.set(null);
  }

  linkedDocument(item: CertificationCase) {
    return item.purchase ?? item.sale;
  }

  isPurchaseCase(item: CertificationCase): boolean {
    return item.dte_type_code === PURCHASE_CODE;
  }

  siiStatusClass(status: string | null): string {
    switch (status) {
      case 'ACCEPTED':
        return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'REJECTED':
        return 'bg-red-50 text-red-500 border-red-100';
      default:
        return 'bg-amber-50 text-amber-600 border-amber-100';
    }
  }

  changePath(path: SiiOnboardingPath): void {
    if (path === this.path() || this.readOnly()) return;

    this._service.updateOnboardingPath(this.companyId(), path).subscribe({
      next: () => {
        this._notification.success('Vía de onboarding actualizada.');
        this.reload();
      },
      error: (err) => this._notification.error(this.messageOf(err, 'No se pudo actualizar la vía de onboarding.')),
    });
  }

  toggleBoletaScope(emitsBoleta: boolean): void {
    if (this.readOnly()) return;

    this._service.updateCertificationScope(this.companyId(), emitsBoleta).subscribe({
      next: () => {
        this._notification.success('Alcance de certificación actualizado.');
        this.reload();
      },
      error: (err) => this._notification.error(this.messageOf(err, 'No se pudo actualizar el alcance.')),
    });
  }

  promote(): void {
    if (this.promoteForm.invalid || !this.canPromote()) return;

    const raw = this.promoteForm.getRawValue();
    this.promoting.set(true);
    this._service
      .promoteToProduction(this.companyId(), {
        resolution_num: raw.resolution_num,
        resolution_date: raw.resolution_date,
        notes: raw.notes || undefined,
      })
      .pipe(finalize(() => this.promoting.set(false)))
      .subscribe({
        next: () => {
          this._notification.success('Empresa habilitada en producción.');
          this.promoteForm.reset({ resolution_num: '', resolution_date: '', notes: '' });
          this.reload();
        },
        error: (err) => this._notification.error(this.messageOf(err, 'No se pudo habilitar producción.')),
      });
  }

  rollback(): void {
    if (this.rollbackReasonCtrl.invalid) return;

    this._service.rollbackToCertification(this.companyId(), this.rollbackReasonCtrl.value).subscribe({
      next: () => {
        this._notification.success('Empresa devuelta al ambiente de certificación.');
        this.rollbackReasonCtrl.reset('');
        this.reload();
      },
      error: (err) => this._notification.error(this.messageOf(err, 'No se pudo volver a certificación.')),
    });
  }

  private messageOf(err: unknown, fallback: string): string {
    const response = err as { error?: { message?: string } };

    return response?.error?.message ?? fallback;
  }
}
