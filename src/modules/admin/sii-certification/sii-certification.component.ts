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
  EmitCertificationCasePayload,
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
  { code: 'LVC', label: 'LVC · Libro de Ventas (Certificación)' },
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

/** Nota de Débito (56) / Nota de Crédito (61): la referencia nunca es opcional. */
const NOTE_DEBIT_CODE = '56';
const NOTE_CREDIT_CODE = '61';

/**
 * Snapshot de `core_note_credit_types` / `core_note_debit_types` (verificado
 * por consola, 2026-08-25). `code` es el `tributary_code` de cada fila, que es
 * exactamente el valor que va en `<CodRef>`; `id` es la fila a enviar como
 * `type_note_credit_id` / `type_note_debit_id`. Catálogo chico y estable — no
 * amerita un endpoint propio, igual que DTE_TYPES más arriba.
 */
const CREDIT_NOTE_TYPES: ReadonlyArray<{ id: number; code: number; label: string }> = [
  { id: 1, code: 1, label: 'Anulación total' },
  { id: 2, code: 2, label: 'Corrección textual' },
  { id: 3, code: 3, label: 'Corrección de montos' },
];
const DEBIT_NOTE_TYPES: ReadonlyArray<{ id: number; code: number; label: string }> = [
  { id: 1, code: 3, label: 'Corrección de montos' },
  // id=2: agregado por la migración 2026_08_25_180100 (caso 4967530-8 del Set
  // de Pruebas — una ND que anula por completo una NC, CodRef=1 por el manual
  // Formato DTE del SII, caso (c) del campo <CodRef>).
  { id: 2, code: 1, label: 'Anulación' },
];

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
  readonly creditNoteTypes = CREDIT_NOTE_TYPES;
  readonly debitNoteTypes = DEBIT_NOTE_TYPES;

  companyId = signal<number>(Number(this._route.snapshot.params['companyId']));
  overview = signal<CertificationOverview | null>(null);
  environment = signal<string>('certificacion');
  selectedProcess = signal<CertificationProcessType>('documentos');

  loading = signal(false);
  savingStep = signal<string | null>(null);
  emittingCaseId = signal<number | null>(null);
  linkingCaseId = signal<number | null>(null);
  deletingCaseId = signal<number | null>(null);
  resendingCaseId = signal<number | null>(null);
  creatingCase = signal(false);
  promoting = signal(false);
  emitFormCaseId = signal<number | null>(null);
  sendingLibro = signal(false);

  path = computed<SiiOnboardingPath>(() => this.overview()?.onboarding_path ?? 'certificacion');
  isEnsayo = computed(() => this.path() === 'emisor_existente');
  readOnly = computed(() => this.overview()?.read_only ?? false);
  emitsBoleta = computed(() => (this.overview()?.certification_scope ?? []).includes('boleta'));
  inProduction = computed(() => this.environment() === 'produccion');

  process = computed(() => this.overview()?.processes?.[this.selectedProcess()] ?? null);
  steps = computed<CertificationStep[]>(() => this.process()?.steps ?? []);
  cases = computed<CertificationCase[]>(() => this.process()?.cases ?? []);
  processApplicable = computed(() => this.process()?.applicable ?? true);

  /** Caso sobre el que está abierto el formulario de emisión, si hay uno. */
  emitFormCase = computed<CertificationCase | null>(
    () => this.cases().find((c) => c.id === this.emitFormCaseId()) ?? null,
  );
  isNoteCredit = computed(() => this.emitFormCase()?.dte_type_code === NOTE_CREDIT_CODE);
  isNoteDebit = computed(() => this.emitFormCase()?.dte_type_code === NOTE_DEBIT_CODE);
  isNoteCase = computed(() => this.isNoteCredit() || this.isNoteDebit());
  /** Casos del mismo proceso ya emitidos: candidatos para referenciar desde una NC/ND. */
  referenceableCases = computed<CertificationCase[]>(() =>
    this.cases().filter((c) => c.id !== this.emitFormCaseId() && !!c.sale?.id),
  );

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

  /** Aparte del form: leerlo desde el template evitaría depender de CD por form.value en zoneless. */
  showGlobalDiscount = signal(false);

  emitForm: FormGroup = this._fb.nonNullable.group({
    date: [this.today()],
    items: this._fb.array([this.buildItem()]),
    /** Referencia 'SET' (no tributaria): así el Set de Pruebas asocia el documento a su caso. */
    includeSetReference: [true],
    discount_surcharge: this._fb.nonNullable.group({
      type: ['D' as 'D' | 'R'],
      value_type: ['%' as '%' | '$'],
      value: [0, [Validators.min(0)]],
    }),
    /** Solo aplica a Nota de Crédito (61) / Nota de Débito (56). */
    reference_venta_id: [null as number | null],
    reference_cod_ref: [null as number | null],
    reference_razon: ['', [Validators.maxLength(90)]],
    type_note_credit_id: [null as number | null],
    type_note_debit_id: [null as number | null],
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

    // El motivo (<CodRef>) viene fijo por el tipo de nota elegido, no se elige
    // aparte. Se deriva por valueChanges (no por (change) en el template) para
    // no depender del orden de listeners frente al ControlValueAccessor del
    // <select> — con [ngValue] el evento DOM no trae el id real.
    this.emitForm.get('type_note_credit_id')?.valueChanges.subscribe((id: number | null) => {
      const code = CREDIT_NOTE_TYPES.find((t) => t.id === id)?.code ?? null;
      this.emitForm.get('reference_cod_ref')?.setValue(code, { emitEvent: false });
    });
    this.emitForm.get('type_note_debit_id')?.valueChanges.subscribe((id: number | null) => {
      const code = DEBIT_NOTE_TYPES.find((t) => t.id === id)?.code ?? null;
      this.emitForm.get('reference_cod_ref')?.setValue(code, { emitEvent: false });
    });
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
      discount_pct: [0, [Validators.min(0), Validators.max(100)]],
      unit_measure: ['', [Validators.maxLength(4)]],
    });
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
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

  /**
   * Reenvía al SII un documento ya emitido. No rehace el DTE ni consume folio:
   * destraba los casos cuyo envío quedó a medias por una caída del SII.
   */
  resendCase(caseId: number): void {
    this.resendingCaseId.set(caseId);
    this._service
      .resendCase(this.companyId(), caseId)
      .pipe(finalize(() => this.resendingCaseId.set(null)))
      .subscribe({
        next: () => {
          this._notification.success('Reenvío al SII solicitado.');
          this.reload();
        },
        error: (err) => this._notification.error(this.messageOf(err, 'No se pudo reenviar el documento.')),
      });
  }

  sendLibroVentas(caseId: number): void {
    if (this.readOnly()) return;

    this.sendingLibro.set(true);
    this._service
      .sendLibroVentas(this.companyId())
      .pipe(finalize(() => this.sendingLibro.set(false)))
      .subscribe({
        next: (res) => {
          this._notification.success('Libro de Ventas de certificación enviado al SII con éxito.');
          this.downloadLibroXml(res.xml_base64);
          if (res.track_id) {
            this._service.updateCase(this.companyId(), caseId, { notes: `TRACKID:${res.track_id}` }).subscribe({
              next: () => this.reload(),
              error: () => this.reload()
            });
          } else {
            this.reload();
          }
        },
        error: (err) => this._notification.error(this.messageOf(err, 'El SII rechazó el Libro de Ventas.')),
      });
  }

  getLvcTrackId(item: CertificationCase): string | null {
    if (item.dte_type_code === 'LVC' && item.notes?.startsWith('TRACKID:')) {
      return item.notes.replace('TRACKID:', '');
    }
    return null;
  }

  private downloadLibroXml(base64: string): void {
    const link = document.createElement('a');
    link.href = `data:application/xml;base64,${base64}`;
    link.download = `libro_ventas_certificacion_${this.companyId()}.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  openEmitForm(caseId: number): void {
    this.emitFormCaseId.set(caseId);
    this.items.clear();
    this.items.push(this.buildItem());

    const item = this.cases().find((c) => c.id === caseId) ?? null;
    this.showGlobalDiscount.set(false);
    this.emitForm.reset({
      date: this.today(),
      includeSetReference: !!(item?.attention_number && item?.case_number),
      discount_surcharge: { type: 'D', value_type: '%', value: 0 },
      reference_venta_id: null,
      reference_cod_ref: null,
      reference_razon: '',
      type_note_credit_id: null,
      type_note_debit_id: null,
    });
  }

  closeEmitForm(): void {
    this.emitFormCaseId.set(null);
  }

  emitCase(caseId: number): void {
    if (this.emitForm.invalid) return;

    const item = this.cases().find((c) => c.id === caseId) ?? null;
    const raw = this.emitForm.getRawValue();

    if (this.isNoteCase()) {
      const missingType = this.isNoteCredit() ? !raw.type_note_credit_id : !raw.type_note_debit_id;
      if (!raw.reference_venta_id || !raw.reference_cod_ref || !raw.reference_razon || missingType) {
        this._notification.error(
          'Para una Nota de Crédito/Débito debe indicar el documento referenciado, el motivo, la razón y el tipo de nota.',
        );

        return;
      }
    }

    const payload: EmitCertificationCasePayload = {
      date: raw.date,
      items: raw.items.map((entry) => ({
        name: entry.name,
        quantity: entry.quantity,
        vr_unitary: entry.vr_unitary,
        is_exempt: entry.is_exempt,
        discount_pct: entry.discount_pct || null,
        unit_measure: entry.unit_measure || null,
      })),
    };

    if (this.showGlobalDiscount() && raw.discount_surcharge.value > 0) {
      payload.discount_surcharge = { ...raw.discount_surcharge };
    }

    if (this.isNoteCase()) {
      payload.reference_venta_id = raw.reference_venta_id;
      payload.reference_cod_ref = raw.reference_cod_ref;
      payload.reference_razon = raw.reference_razon;
      if (this.isNoteCredit()) payload.type_note_credit_id = raw.type_note_credit_id;
      if (this.isNoteDebit()) payload.type_note_debit_id = raw.type_note_debit_id;
    }

    if (raw.includeSetReference && item?.attention_number && item?.case_number) {
      payload.document_references = [
        {
          tipo_doc_ref: 'SET',
          folio_ref: 1,
          fecha_ref: raw.date,
          razon_ref: `CASO ${item.attention_number}-${item.case_number}`,
        },
      ];
    }

    this.emittingCaseId.set(caseId);
    this._service
      .emitCase(this.companyId(), caseId, payload)
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
