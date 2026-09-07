import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import {
  CertificationCase,
  CertificationOverview,
  CertificationProcessType,
  CertificationPurchaseLine,
  CertificationStep,
  CertificationStepStatus,
  EmitCertificationCaseExport,
  EmitCertificationCasePayload,
  SiiAdminService,
  SiiOnboardingPath,
  SiiCompanyResolution,
  StorePurchaseLinePayload,
  StoreResolutionPayload,
} from '@core/services/sii-admin.service';
import { NotificationService } from '@core/services/notification.service';
import { AduanaCatalogItem, AduanaCatalogService } from '@core/services/aduana-catalog.service';

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
  { code: 'LCC', label: 'LCC · Libro de Compras (Certificación)' },
  { code: 'LGD', label: 'LGD · Libro de Guías (Certificación)' },
];

/** Anulado del Libro de Guías: distingue si el SII ya recibió la guía. */
const GUIDE_BOOK_ANULADO_TYPES: ReadonlyArray<{ value: number; label: string }> = [
  { value: 1, label: '1 · Anulada antes de enviarse al SII' },
  { value: 2, label: '2 · Anulada después de enviarse al SII' },
  { value: 3, label: '3 · Productos recibidos parcialmente' },
];

/** Tipos de documento que pueden facturar una Guía de Despacho en el período. */
const GUIDE_BOOK_REF_TYPES: ReadonlyArray<{ code: string; label: string }> = [
  { code: '33', label: '33 · Factura Electrónica' },
  { code: '34', label: '34 · Factura Exenta' },
  { code: '56', label: '56 · Nota de Débito' },
  { code: '61', label: '61 · Nota de Crédito' },
];

/** Naturalezas del Libro de Compras: determinan en qué campo del XML va el IVA. */
const PURCHASE_LINE_NATURES: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'normal', label: 'Con derecho a crédito' },
  { value: 'iva_uso_comun', label: 'IVA uso común' },
  { value: 'entrega_gratuita', label: 'Entrega gratuita' },
  { value: 'retencion_total', label: 'Retención total del IVA' },
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
 * Nota de Débito (56) / Nota de Crédito (61) y sus contrapartes de
 * exportación (111/112): la referencia nunca es opcional.
 */
const NOTE_DEBIT_CODES: ReadonlySet<string> = new Set(['56', '111']);
const NOTE_CREDIT_CODES: ReadonlySet<string> = new Set(['61', '112']);

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

/** Código del DTE Guía de Despacho: dispara el bloque de traslado en el formulario. */
const DISPATCH_CODE = '52';

/**
 * Factura Exenta (34) / Boleta Exenta (41) y Factura/Nota de Exportación
 * (110/111/112): TODOS sus ítems son exentos por definición del propio
 * documento — no es una opción del operador. Un ítem marcado is_exempt=false
 * ahí produce un DTE con <IVA> cargado, que el SII rechaza (ago-2026: caso
 * real 4967535-1, rechazado dos veces por esto antes de bloquear el
 * checkbox). En exportación el riesgo es más sutil: DteBuilderService arma
 * <Totales> como MntExe = venta->total sin mirar is_exempt, así que un ítem
 * afecto no dispara un rechazo del SII pero infla el monto exportado con un
 * 19% de IVA que nunca debió calcularse.
 */
const ALWAYS_EXEMPT_CODES: ReadonlySet<string> = new Set(['34', '41', '110', '111', '112']);

/** Factura de Exportación (110) / Nota de Débito (111) / Nota de Crédito (112) de exportación. */
const EXPORT_CODES: ReadonlySet<string> = new Set(['110', '111', '112']);

/** <IndTraslado> del IdDoc (DTE_v10.xsd, enumeración completa verificada). El Set de Pruebas exige declararlo siempre. */
const IND_TRASLADO_TYPES: ReadonlyArray<{ code: number; label: string }> = [
  { code: 1, label: '1 · Operación constituye venta' },
  { code: 2, label: '2 · Venta por efectuar' },
  { code: 3, label: '3 · Consignación' },
  { code: 4, label: '4 · Promoción o donación' },
  { code: 5, label: '5 · Traslado interno' },
  { code: 6, label: '6 · Otros traslados que no constituyen venta' },
  { code: 7, label: '7 · Guía de devolución' },
];

/** <TipoDespacho> del IdDoc. Se omite por completo en el traslado interno. */
const TIPO_DESPACHO_TYPES: ReadonlyArray<{ code: number; label: string }> = [
  { code: 1, label: '1 · Por cuenta del comprador' },
  { code: 2, label: '2 · Por cuenta del emisor, a instalaciones del comprador' },
  { code: 3, label: '3 · Por cuenta del emisor, a otras instalaciones' },
];

/** <CodModVenta> del DTE de Exportación (tabla fija SII/Aduana, igual que en el Portal Cliente). */
const SALE_MODALITIES: ReadonlyArray<{ code: number; label: string }> = [
  { code: 1, label: '1 · A firme' },
  { code: 2, label: '2 · Bajo condición' },
  { code: 3, label: '3 · En consignación libre' },
  { code: 4, label: '4 · En consignación con mínimo a firme' },
  { code: 9, label: '9 · Sin pago' },
];

/**
 * <IndServicio> del DTE de Exportación (Formato DTE v2.5, tabla del campo N°9).
 * Solo clasifica OPERACIONES DE SERVICIOS — no existe código para "venta de
 * bienes": una exportación de bienes físicos simplemente omite el campo
 * (se deja en null en el formulario). El bloque <Exportaciones> del XSD
 * admite 3, 4, 5 y 6 — los valores 1 y 2 son exclusivos del bloque nacional.
 */
const EXPORT_SERVICE_TYPES: ReadonlyArray<{ code: number; label: string }> = [
  { code: 3, label: '3 · Servicios calificados como tal por Aduana' },
  { code: 4, label: '4 · Servicios de hotelería' },
  { code: 5, label: '5 · Transporte terrestre internacional' },
  { code: 6, label: '6 · Servicios prestados y utilizados totalmente en el extranjero' },
];

/**
 * Tabla "Unidades de Medida" de Aduana (<CodUnidMedTara>, <CodUnidPesoBruto>,
 * <CodUnidPesoNeto>). No está en la BD: `aduana_anexo51_unit_measure` es la
 * tabla del Arancel (símbolos U-10, MT2-15…), que es otra cosa. Códigos
 * verificados contra `aduana_unidades.php` de libredte-lib-core.
 */
const ADUANA_UNITS: ReadonlyArray<{ code: number; label: string }> = [
  { code: 1, label: 'TMB · Tonelada métrica bruta' },
  { code: 2, label: 'QMB · Quintal métrico bruto' },
  { code: 3, label: 'MKWH · 1000 kilowatt hora' },
  { code: 4, label: 'TMN · Tonelada métrica neta' },
  { code: 5, label: 'KLT · Kilolitro' },
  { code: 6, label: 'KN · Kilo neto' },
  { code: 7, label: 'GN · Gramo neto' },
  { code: 8, label: 'HL · Hectolitro' },
  { code: 9, label: 'LT · Litro' },
  { code: 10, label: 'U · Unidad' },
  { code: 11, label: 'DOC · Docena' },
  { code: 12, label: 'U(JGO) · Juego' },
  { code: 13, label: 'MU · Millar' },
  { code: 14, label: 'MT · Metro' },
  { code: 15, label: 'MT2 · Metro cuadrado' },
  { code: 16, label: 'MCUB · Metro cúbico' },
  { code: 17, label: 'PAR · Par' },
  { code: 18, label: 'KNFC · Kilo neto fuera de cáscara' },
  { code: 19, label: 'CARTON · Cartón' },
  { code: 20, label: 'KWH · Kilowatt hora' },
  { code: 23, label: 'BAR · Barril' },
  { code: 24, label: 'M2/1MM · Metro cuadrado 1 mm' },
  { code: 99, label: 'S.U.M · Sin unidad de medida' },
];

/**
 * Documentos que un DTE de Exportación puede referenciar (<TpoDocRef>). Son
 * códigos NO tributarios de la tabla "Otros documentos" del Formato DTE;
 * verificados contra `tipos_documento.php` de libredte-lib-core.
 */
const EXPORT_REFERENCE_TYPES: ReadonlyArray<{ code: string; label: string }> = [
  { code: '801', label: '801 · Orden de compra' },
  { code: '802', label: '802 · Nota de pedido' },
  { code: '803', label: '803 · Contrato' },
  { code: '804', label: '804 · Resolución' },
  { code: '805', label: '805 · Proceso ChileCompra' },
  { code: '806', label: '806 · Ficha ChileCompra' },
  { code: '807', label: '807 · DUS' },
  { code: '808', label: '808 · B/L (Conocimiento de embarque)' },
  { code: '809', label: '809 · AWB (Air Way Bill)' },
  { code: '810', label: '810 · MIC (Manifiesto internacional)' },
  { code: '811', label: '811 · Carta de porte' },
  { code: '812', label: '812 · Resolución SNA' },
  { code: '813', label: '813 · Pasaporte' },
  { code: '814', label: '814 · Certificado de depósito Bolsa Prod. Chile' },
  { code: '815', label: '815 · Vale de prenda Bolsa Prod. Chile' },
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
  private _aduanaCatalogs = inject(AduanaCatalogService);

  readonly dteTypes = DTE_TYPES;
  readonly creditNoteTypes = CREDIT_NOTE_TYPES;
  readonly debitNoteTypes = DEBIT_NOTE_TYPES;
  readonly indTrasladoTypes = IND_TRASLADO_TYPES;
  readonly tipoDespachoTypes = TIPO_DESPACHO_TYPES;
  readonly saleModalities = SALE_MODALITIES;
  readonly aduanaUnits = ADUANA_UNITS;
  readonly exportServiceTypes = EXPORT_SERVICE_TYPES;
  readonly exportReferenceTypes = EXPORT_REFERENCE_TYPES;

  /** Catálogos Anexo 51: carga perezosa, una sola vez, al abrir el primer caso de exportación. */
  exportCurrencies = signal<AduanaCatalogItem[]>([]);
  exportCountries = signal<AduanaCatalogItem[]>([]);
  exportPorts = signal<AduanaCatalogItem[]>([]);
  exportTransportModes = signal<AduanaCatalogItem[]>([]);
  exportIncoterms = signal<AduanaCatalogItem[]>([]);
  exportPaymentMethods = signal<AduanaCatalogItem[]>([]);
  exportPackageTypes = signal<AduanaCatalogItem[]>([]);
  private _exportCatalogsLoaded = false;

  companyId = signal<number>(Number(this._route.snapshot.params['companyId']));
  overview = signal<CertificationOverview | null>(null);
  environment = signal<string>('certificacion');
  resolutions = signal<SiiCompanyResolution[]>([]);
  savingResolution = signal<boolean>(false);

  resolutionForm = this._fb.group({
    environment: ['certificacion' as 'certificacion' | 'produccion', Validators.required],
    // 0 es un valor legítimo: el SII registra Resolución 0 en certificación.
    resolution_number: [0, [Validators.required, Validators.min(0)]],
    resolution_date: ['', Validators.required],
    authorization_date: [''],
  });

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

  readonly purchaseLineNatures = PURCHASE_LINE_NATURES;

  purchaseLines = signal<CertificationPurchaseLine[]>([]);
  purchaseLinesCaseId = signal<number | null>(null);
  savingPurchaseLine = signal(false);
  sendingLibroCompras = signal(false);

  purchaseLineForm = this._fb.group({
    doc_tributary_code: ['33', Validators.required],
    folio: [null as number | null, [Validators.required, Validators.min(1)]],
    counterparty_rut: ['', Validators.required],
    counterparty_name: ['', Validators.required],
    doc_date: [this.today(), Validators.required],
    amount_exempt: [0, [Validators.required, Validators.min(0)]],
    amount_net: [0, [Validators.required, Validators.min(0)]],
    nature: ['normal', Validators.required],
    proportionality_factor: [null as number | null],
    observations: [''],
  });

  readonly guideBookAnuladoTypes = GUIDE_BOOK_ANULADO_TYPES;
  readonly guideBookRefTypes = GUIDE_BOOK_REF_TYPES;

  sendingLibroGuias = signal(false);
  guideBookCaseId = signal<number | null>(null);
  /** Folio de la notificación con que el SII solicitó el Libro de Guías. */
  folioNotificacionControl = new FormControl<number | null>(null);
  /** Un FormGroup por guía, reconstruido cada vez que se abre el panel. */
  guideBookForms = signal<Map<number, FormGroup>>(new Map());

  /**
   * Guías 52 de la empresa: TODAS se incluyen en el Libro, sin selección
   * posible — sean 1 o 20. No hay forma de excluir una guía del envío.
   */
  dispatchCases = computed(() => this.cases().filter((c) => c.dte_type_code === '52'));

  /** Folios que efectivamente viajarán en el próximo "Enviar Libro". */
  dispatchCaseFolios = computed(() => this.dispatchCases().map((g) => g.sale?.folio ?? '—').join(', '));

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
  isNoteCredit = computed(() => NOTE_CREDIT_CODES.has(this.emitFormCase()?.dte_type_code ?? ''));
  isNoteDebit = computed(() => NOTE_DEBIT_CODES.has(this.emitFormCase()?.dte_type_code ?? ''));
  isNoteCase = computed(() => this.isNoteCredit() || this.isNoteDebit());
  isDispatchGuide = computed(() => this.emitFormCase()?.dte_type_code === DISPATCH_CODE);
  /** Factura Exenta (34) / Boleta Exenta (41): todo ítem es exento, sin excepción. */
  isAlwaysExempt = computed(() => ALWAYS_EXEMPT_CODES.has(this.emitFormCase()?.dte_type_code ?? ''));
  /** Factura/Nota de Exportación (110/111/112): dispara el bloque Aduana + OtraMoneda. */
  isExportCase = computed(() => EXPORT_CODES.has(this.emitFormCase()?.dte_type_code ?? ''));
  /** Traslado interno: el receptor lo resuelve la API como la propia empresa. */
  isInternalTransfer = computed(() => this.emitForm.get('dispatch.ind_traslado')?.value === 5);
  /** Casos del mismo proceso ya emitidos: candidatos para referenciar desde una NC/ND. */
  referenceableCases = computed<CertificationCase[]>(() =>
    this.cases().filter((c) => c.id !== this.emitFormCaseId() && !!c.sale?.id),
  );
  /**
   * 56/61 también corrigen una Factura de Compra (46): a diferencia de sus
   * contrapartes de exportación (111/112, siempre sobre una venta), estas dos
   * pueden referenciar indistintamente una venta o una compra.
   */
  canReferencePurchase = computed(() => this.isNoteCase() && !this.isExportCase());
  /** Compras del mismo proceso ya emitidas: candidatas para referenciar desde una NC/ND. */
  referenceablePurchaseCases = computed<CertificationCase[]>(() =>
    this.cases().filter((c) => c.id !== this.emitFormCaseId() && !!c.purchase?.id),
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
    /** Excluyente con reference_venta_id: la nota corrige una Factura de Compra (46). */
    reference_purchase_id: [null as number | null],
    reference_cod_ref: [null as number | null],
    reference_razon: ['', [Validators.maxLength(90)]],
    type_note_credit_id: [null as number | null],
    type_note_debit_id: [null as number | null],
    /** Solo Guía de Despacho (52): traslado + transporte. */
    dispatch: this._fb.group({
      tipo_despacho: [null as number | null],
      ind_traslado: [null as number | null],
      patente: [''],
      rut_transporte: [''],
      rut_chofer: [''],
      nombre_chofer: [''],
      dir_dest: [''],
      comuna_dest: [''],
      ciudad_dest: [''],
    }),
    /**
     * Solo Factura/Nota de Exportación (110/111/112): Receptor extranjero +
     * Aduana + OtraMoneda. peso_bruto/peso_neto/tot_bultos/nom_cia_transp no
     * se exponen aquí: DteBuilderService::buildExportTransporte() los omite
     * del XML por faltar los códigos de unidad de medida obligatorios (gap
     * documentado en el propio backend, igual que en el Portal Cliente) —
     * pedirlos en el formulario induciría a creer que viajan al SII.
     */
    export: this._fb.group({
      tpo_moneda: [''],
      tpo_cambio: [null as number | null],
      fma_pag_exp: [null as number | null],
      fch_cancel: [''],
      ind_servicio: [null as number | null],
      recep_num_id: [''],
      recep_nacionalidad: [null as number | null],
      cod_mod_venta: [null as number | null],
      cod_clau_venta: [null as number | null],
      tot_clau_venta: [null as number | null],
      cod_via_transp: [null as number | null],
      nombre_transp: [''],
      rut_cia_transp: [''],
      cod_pto_embarque: [null as number | null],
      cod_pto_desemb: [null as number | null],
      tara: [null as number | null],
      cod_unid_med_tara: [null as number | null],
      peso_bruto: [null as number | null],
      cod_unid_peso_bruto: [null as number | null],
      peso_neto: [null as number | null],
      cod_unid_peso_neto: [null as number | null],
      tot_bultos: [null as number | null],
      cod_tpo_bultos: [null as number | null],
      cant_bultos: [null as number | null],
      mnt_flete: [null as number | null],
      mnt_seguro: [null as number | null],
      cod_pais_recep: [null as number | null],
      cod_pais_destin: [null as number | null],
    }),
    /** Referencias libres (MIC, DUS, B/L…), aparte de la referencia 'SET'. */
    references: this._fb.array([] as FormGroup[]),
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

    // reference_venta_id y reference_purchase_id son excluyentes: la nota
    // corrige una venta o una compra, nunca ambas a la vez.
    this.emitForm.get('reference_venta_id')?.valueChanges.subscribe((id: number | null) => {
      if (id) this.emitForm.get('reference_purchase_id')?.setValue(null, { emitEvent: false });
    });
    this.emitForm.get('reference_purchase_id')?.valueChanges.subscribe((id: number | null) => {
      if (id) this.emitForm.get('reference_venta_id')?.setValue(null, { emitEvent: false });
    });
  }

  get items(): FormArray<FormGroup> {
    return this.emitForm.get('items') as FormArray<FormGroup>;
  }

  /**
   * `forceExempt` toma por defecto el tipo del caso abierto en el formulario:
   * cada ítem nuevo de una Factura/Boleta Exenta nace marcado Y bloqueado en
   * true, así el operador no puede repetir el error de dejarlo en false.
   */
  private buildItem(forceExempt: boolean = this.isAlwaysExempt()): FormGroup {
    return this._fb.nonNullable.group({
      name: ['', [Validators.required, Validators.maxLength(80)]],
      quantity: [1, [Validators.required, Validators.min(0.0001)]],
      vr_unitary: [0, [Validators.required, Validators.min(0)]],
      is_exempt: [{ value: forceExempt, disabled: forceExempt }],
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

  get references(): FormArray<FormGroup> {
    return this.emitForm.get('references') as FormArray<FormGroup>;
  }

  addReference(): void {
    this.references.push(
      this._fb.nonNullable.group({
        tipo_doc_ref: ['', Validators.required],
        folio_ref: [null as number | null, [Validators.required, Validators.min(1)]],
        fecha_ref: [this.today(), Validators.required],
        razon_ref: ['', [Validators.maxLength(90)]],
      }),
    );
  }

  removeReference(index: number): void {
    this.references.removeAt(index);
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

    this.loadResolutions();
  }

  loadResolutions(): void {
    this._service.listResolutions(this.companyId()).subscribe({
      next: (data) => this.resolutions.set(data),
      error: () => this._notification.error('No se pudieron cargar las resoluciones.'),
    });
  }

  submitResolution(): void {
    if (this.resolutionForm.invalid || this.savingResolution()) return;

    this.savingResolution.set(true);
    const raw = this.resolutionForm.getRawValue();

    const payload: StoreResolutionPayload = {
      environment: raw.environment ?? 'certificacion',
      resolution_number: Number(raw.resolution_number ?? 0),
      resolution_date: raw.resolution_date ?? '',
      authorization_date: raw.authorization_date || null,
    };

    this._service
      .storeResolution(this.companyId(), payload)
      .pipe(finalize(() => this.savingResolution.set(false)))
      .subscribe({
        next: () => {
          this._notification.success('Resolución guardada exitosamente.');
          this.loadResolutions();
          this.resolutionForm.reset({ environment: 'certificacion', resolution_number: 0 });
        },
        error: (err) => this._notification.error(this.messageOf(err, 'No se pudo guardar la resolución.')),
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
  resendCase(caseId: number, rebuild = false): void {
    if (
      rebuild &&
      !confirm(
        'Se reconstruirá el DTE desde cero y se tomará un folio nuevo. Úsalo solo si el SII rechazó el documento por esquema inválido. ¿Continuar?',
      )
    ) {
      return;
    }

    this.resendingCaseId.set(caseId);
    this._service
      .resendCase(this.companyId(), caseId, rebuild)
      .pipe(finalize(() => this.resendingCaseId.set(null)))
      .subscribe({
        next: () => {
          this._notification.success(
            rebuild ? 'DTE reconstruido y reenviado al SII.' : 'Reenvío al SII solicitado.',
          );
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
          this.downloadLibroXml(res.xml_base64);

          if (res.track_id) {
            this._notification.success(`Libro de Ventas enviado al SII. Track ${res.track_id}.`);
            this._service.updateCase(this.companyId(), caseId, { notes: `TRACKID:${res.track_id}` }).subscribe({
              next: () => this.reload(),
              error: () => this.reload(),
            });
          } else {
            this._notification.error(res.glosa ?? 'El SII rechazó el Libro de Ventas.');
          }
        },
        error: (err) => this._notification.error(this.messageOf(err, 'No se pudo enviar el Libro de Ventas al SII.')),
      });
  }

  getLvcTrackId(item: CertificationCase): string | null {
    if (
      (item.dte_type_code === 'LVC' || item.dte_type_code === 'LCC' || item.dte_type_code === 'LGD') &&
      item.notes?.startsWith('TRACKID:')
    ) {
      return item.notes.replace('TRACKID:', '');
    }
    return null;
  }

  openPurchaseLines(caseId: number): void {
    this.purchaseLinesCaseId.set(caseId);
    this.purchaseLineForm.reset({
      doc_tributary_code: '33',
      folio: null,
      counterparty_rut: '',
      counterparty_name: '',
      doc_date: this.today(),
      amount_exempt: 0,
      amount_net: 0,
      nature: 'normal',
      proportionality_factor: null,
      observations: '',
    });
    this.loadPurchaseLines();
  }

  closePurchaseLines(): void {
    this.purchaseLinesCaseId.set(null);
  }

  loadPurchaseLines(): void {
    this._service.listPurchaseLines(this.companyId()).subscribe({
      next: (lines) => this.purchaseLines.set(lines),
      error: (err) => this._notification.error(this.messageOf(err, 'No se pudieron cargar las líneas del Libro de Compras.')),
    });
  }

  addPurchaseLine(): void {
    if (this.purchaseLineForm.invalid) return;

    const raw = this.purchaseLineForm.getRawValue();

    if (raw.nature === 'iva_uso_comun' && !raw.proportionality_factor) {
      this._notification.error('Indique el factor de proporcionalidad para una línea de IVA uso común.');

      return;
    }

    const payload: StorePurchaseLinePayload = {
      doc_tributary_code: raw.doc_tributary_code!,
      folio: raw.folio!,
      counterparty_rut: raw.counterparty_rut!,
      counterparty_name: raw.counterparty_name!,
      doc_date: raw.doc_date!,
      amount_exempt: raw.amount_exempt!,
      amount_net: raw.amount_net!,
      nature: raw.nature as StorePurchaseLinePayload['nature'],
      proportionality_factor: raw.proportionality_factor,
      observations: raw.observations || null,
    };

    this.savingPurchaseLine.set(true);
    this._service
      .storePurchaseLine(this.companyId(), payload)
      .pipe(finalize(() => this.savingPurchaseLine.set(false)))
      .subscribe({
        next: () => {
          this._notification.success('Línea agregada.');
          this.purchaseLineForm.patchValue({ folio: null, amount_exempt: 0, amount_net: 0, observations: '' });
          this.loadPurchaseLines();
        },
        error: (err) => this._notification.error(this.messageOf(err, 'No se pudo agregar la línea.')),
      });
  }

  removePurchaseLine(lineId: number): void {
    this._service.deletePurchaseLine(this.companyId(), lineId).subscribe({
      next: () => this.loadPurchaseLines(),
      error: (err) => this._notification.error(this.messageOf(err, 'No se pudo eliminar la línea.')),
    });
  }

  sendLibroCompras(caseId: number): void {
    if (this.readOnly()) return;

    this.sendingLibroCompras.set(true);
    this._service
      .sendLibroCompras(this.companyId())
      .pipe(finalize(() => this.sendingLibroCompras.set(false)))
      .subscribe({
        next: (res) => {
          this.downloadLibroXml(res.xml_base64, `libro_compras_certificacion_${this.companyId()}.xml`);

          if (res.track_id) {
            this._notification.success(`Libro de Compras enviado al SII. Track ${res.track_id}.`);
            this._service.updateCase(this.companyId(), caseId, { notes: `TRACKID:${res.track_id}` }).subscribe({
              next: () => this.reload(),
              error: () => this.reload(),
            });
          } else {
            this._notification.error(res.glosa ?? 'El SII rechazó el Libro de Compras.');
          }
        },
        error: (err) => this._notification.error(this.messageOf(err, 'No se pudo enviar el Libro de Compras al SII.')),
      });
  }

  /**
   * Abre el panel: pre-carga el folio de notificación desde el número de
   * atención del propio caso LGD (el SII no entrega un folio aparte, el
   * número con que solicita el set ES la notificación; si no es numérico
   * queda vacío y lo escribe el operador — jamás se adivina, es
   * positiveInteger) y arma un FormGroup por guía con valores DUMMY de
   * relleno para que el libro se pueda enviar sin carga manual previa.
   */
  openGuideBook(caseId: number): void {
    const item = this.cases().find((c) => c.id === caseId);
    const digits = (item?.attention_number ?? '').replace(/\D/g, '');
    this.folioNotificacionControl.setValue(digits ? Number(digits) : null);

    const forms = new Map<number, FormGroup>();
    for (const guide of this.dispatchCases()) {
      forms.set(
        guide.id,
        this._fb.group({
          guide_book_anulado: [guide.guide_book_anulado ?? null],
          guide_book_ref_type: [guide.guide_book_ref_type ?? '33'],
          guide_book_ref_folio: [guide.guide_book_ref_folio ?? 1, Validators.min(1)],
          guide_book_ref_date: [guide.guide_book_ref_date ?? this.today()],
        }),
      );
    }
    this.guideBookForms.set(forms);

    this.guideBookCaseId.set(caseId);
  }

  closeGuideBook(): void {
    this.guideBookCaseId.set(null);
  }

  /**
   * Cómo se declarará esta guía en el Libro — SIEMPRE se envía, sin
   * excepción; esto solo describe con qué atributo. Lee lo persistido en
   * `guide` (dato que viaja con `cases()`, se actualiza tras reload()),
   * nunca el formulario: el formulario puede mostrar el dummy sin que nada
   * se haya guardado. Replica la condición de LibroGuiasCertificationService.
   */
  guideBookStatus(guide: CertificationCase): string {
    if (guide.guide_book_anulado != null) {
      const label = this.guideBookAnuladoTypes.find((t) => t.value === guide.guide_book_anulado)?.label;
      return `Se enviará como: ${label ?? 'anulada'}`;
    }
    if (guide.guide_book_ref_type && guide.guide_book_ref_folio && guide.guide_book_ref_date) {
      return `Se enviará como: facturada con ${guide.guide_book_ref_type}/${guide.guide_book_ref_folio}`;
    }
    return 'Se enviará como: venta normal (sin anulado ni referencia)';
  }

  guideBookHasExtraAttribute(guide: CertificationCase): boolean {
    return (
      guide.guide_book_anulado != null ||
      !!(guide.guide_book_ref_type && guide.guide_book_ref_folio && guide.guide_book_ref_date)
    );
  }

  /**
   * true si alguna fila tiene cambios tipeados que todavía no se guardaron.
   * Bloquea "Enviar Libro": ese botón lee la base, no el formulario, así que
   * enviar con ediciones pendientes las dejaría fuera sin aviso.
   */
  hasUnsavedGuideBookChanges(): boolean {
    return Array.from(this.guideBookForms().values()).some((form) => form.dirty);
  }

  /** Persiste los atributos del Libro de Guías sobre el propio caso 52. */
  saveGuideBookLine(guideId: number): void {
    const form = this.guideBookForms().get(guideId);
    if (!form) return;

    this._service.updateCase(this.companyId(), guideId, form.getRawValue()).subscribe({
      next: () => {
        // Sin esto, el formulario queda "dirty" aunque el valor ya coincida
        // con lo guardado, y bloquearía "Enviar Libro" innecesariamente.
        form.markAsPristine();
        this._notification.success('Datos del Libro de Guías guardados.');
        this.reload();
      },
      error: (err) => this._notification.error(this.messageOf(err, 'No se pudieron guardar los datos del Libro de Guías.')),
    });
  }

  sendLibroGuias(caseId: number): void {
    if (this.readOnly()) return;

    if (this.hasUnsavedGuideBookChanges()) {
      this._notification.error('Hay cambios sin guardar en "Datos del Libro". Guárdalos antes de enviar.');

      return;
    }

    const folio = this.folioNotificacionControl.value;
    if (!folio || folio < 1) {
      this._notification.error('Indique el folio de notificación con que el SII solicitó el Libro de Guías.');

      return;
    }

    this.sendingLibroGuias.set(true);
    this._service
      .sendLibroGuias(this.companyId(), folio)
      .pipe(finalize(() => this.sendingLibroGuias.set(false)))
      .subscribe({
        next: (res) => {
          this.downloadLibroXml(res.xml_base64, `libro_guias_certificacion_${this.companyId()}.xml`);

          if (res.track_id) {
            this._notification.success(`Libro de Guías enviado al SII. Track ${res.track_id}.`);
            this._service.updateCase(this.companyId(), caseId, { notes: `TRACKID:${res.track_id}` }).subscribe({
              next: () => this.reload(),
              error: () => this.reload(),
            });
          } else {
            this._notification.error(res.glosa ?? 'El SII rechazó el Libro de Guías.');
          }
        },
        error: (err) => this._notification.error(this.messageOf(err, 'No se pudo enviar el Libro de Guías al SII.')),
      });
  }

  private downloadLibroXml(base64: string, filename = `libro_ventas_certificacion_${this.companyId()}.xml`): void {
    const link = document.createElement('a');
    link.href = `data:application/xml;base64,${base64}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  openEmitForm(caseId: number): void {
    this.emitFormCaseId.set(caseId);
    this.items.clear();
    this.items.push(this.buildItem());
    this.references.clear();

    const item = this.cases().find((c) => c.id === caseId) ?? null;
    this.showGlobalDiscount.set(false);
    this.emitForm.reset({
      date: this.today(),
      includeSetReference: !!(item?.attention_number && item?.case_number),
      discount_surcharge: { type: 'D', value_type: '%', value: 0 },
      reference_venta_id: null,
      reference_purchase_id: null,
      reference_cod_ref: null,
      reference_razon: '',
      type_note_credit_id: null,
      type_note_debit_id: null,
      dispatch: {
        tipo_despacho: null,
        ind_traslado: null,
        patente: '',
        rut_transporte: '',
        rut_chofer: '',
        nombre_chofer: '',
        dir_dest: '',
        comuna_dest: '',
        ciudad_dest: '',
      },
      export: {
        tpo_moneda: '',
        tpo_cambio: null,
        fma_pag_exp: null,
        fch_cancel: '',
        ind_servicio: null,
        recep_num_id: '',
        recep_nacionalidad: null,
        cod_mod_venta: null,
        cod_clau_venta: null,
        tot_clau_venta: null,
        cod_via_transp: null,
        nombre_transp: '',
        rut_cia_transp: '',
        cod_pto_embarque: null,
        cod_pto_desemb: null,
        tara: null,
        cod_unid_med_tara: null,
        peso_bruto: null,
        cod_unid_peso_bruto: null,
        peso_neto: null,
        cod_unid_peso_neto: null,
        tot_bultos: null,
        cod_tpo_bultos: null,
        cant_bultos: null,
        mnt_flete: null,
        mnt_seguro: null,
        cod_pais_recep: null,
        cod_pais_destin: null,
      },
    });

    if (EXPORT_CODES.has(item?.dte_type_code ?? '')) {
      this.ensureExportCatalogsLoaded();
    }
  }

  /** Carga los catálogos Anexo 51 una sola vez, la primera vez que se abre un caso de exportación. */
  private ensureExportCatalogsLoaded(): void {
    if (this._exportCatalogsLoaded) return;
    this._exportCatalogsLoaded = true;

    const companyId = this.companyId();
    const onError = () => {
      this._exportCatalogsLoaded = false;
      this._notification.error('No se pudieron cargar los catálogos de exportación (país/puerto/moneda). Reintente abriendo el caso de nuevo.');
    };
    this._aduanaCatalogs.getCurrencies(companyId).subscribe({ next: (data) => this.exportCurrencies.set(data), error: onError });
    this._aduanaCatalogs.getCountries(companyId).subscribe({ next: (data) => this.exportCountries.set(data), error: onError });
    this._aduanaCatalogs.getPorts(companyId).subscribe({ next: (data) => this.exportPorts.set(data), error: onError });
    this._aduanaCatalogs.getTransportModes(companyId).subscribe({ next: (data) => this.exportTransportModes.set(data), error: onError });
    this._aduanaCatalogs.getIncoterms(companyId).subscribe({ next: (data) => this.exportIncoterms.set(data), error: onError });
    this._aduanaCatalogs.getPaymentMethods(companyId).subscribe({ next: (data) => this.exportPaymentMethods.set(data), error: onError });
    this._aduanaCatalogs.getPackageTypes(companyId).subscribe({ next: (data) => this.exportPackageTypes.set(data), error: onError });
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
      const missingReference = this.canReferencePurchase()
        ? !raw.reference_venta_id && !raw.reference_purchase_id
        : !raw.reference_venta_id;
      if (missingReference || !raw.reference_cod_ref || !raw.reference_razon || missingType) {
        this._notification.error(
          'Para una Nota de Crédito/Débito debe indicar el documento referenciado, el motivo, la razón y el tipo de nota.',
        );

        return;
      }
    }

    if (this.isDispatchGuide() && !raw.dispatch.ind_traslado) {
      this._notification.error('Debe indicar el tipo de traslado de la Guía de Despacho.');

      return;
    }

    if (this.isExportCase() && (!raw.export.tpo_moneda || !raw.export.tpo_cambio)) {
      this._notification.error('Debe indicar la moneda y el tipo de cambio de la exportación.');

      return;
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
      if (raw.reference_purchase_id) {
        payload.reference_purchase_id = raw.reference_purchase_id;
      } else {
        payload.reference_venta_id = raw.reference_venta_id;
      }
      payload.reference_cod_ref = raw.reference_cod_ref;
      payload.reference_razon = raw.reference_razon;
      if (this.isNoteCredit()) payload.type_note_credit_id = raw.type_note_credit_id;
      if (this.isNoteDebit()) payload.type_note_debit_id = raw.type_note_debit_id;
    }

    if (this.isDispatchGuide()) {
      const d = raw.dispatch;
      payload.dispatch = {
        // El traslado interno NO lleva TipoDespacho (LibroCV/DTE_v10.xsd).
        tipo_despacho: d.ind_traslado === 5 ? null : d.tipo_despacho,
        ind_traslado: d.ind_traslado,
        patente: d.patente || null,
        rut_transporte: d.rut_transporte || null,
        rut_chofer: d.rut_chofer || null,
        nombre_chofer: d.nombre_chofer || null,
        dir_dest: d.dir_dest || null,
        comuna_dest: d.comuna_dest || null,
        ciudad_dest: d.ciudad_dest || null,
      };
    }

    if (this.isExportCase()) {
      const e = raw.export;
      const exportPayload: EmitCertificationCaseExport = {
        tpo_moneda: e.tpo_moneda,
        tpo_cambio: e.tpo_cambio as number,
        recep_num_id: e.recep_num_id || null,
        recep_nacionalidad: e.recep_nacionalidad,
        cod_mod_venta: e.cod_mod_venta,
        cod_clau_venta: e.cod_clau_venta,
        tot_clau_venta: e.tot_clau_venta,
        cod_via_transp: e.cod_via_transp,
        nombre_transp: e.nombre_transp || null,
        rut_cia_transp: e.rut_cia_transp || null,
        cod_pto_embarque: e.cod_pto_embarque,
        cod_pto_desemb: e.cod_pto_desemb,
        fma_pag_exp: e.fma_pag_exp,
        fch_cancel: e.fch_cancel || null,
        ind_servicio: e.ind_servicio,
        tara: e.tara,
        cod_unid_med_tara: e.cod_unid_med_tara,
        peso_bruto: e.peso_bruto,
        cod_unid_peso_bruto: e.cod_unid_peso_bruto,
        peso_neto: e.peso_neto,
        cod_unid_peso_neto: e.cod_unid_peso_neto,
        tot_bultos: e.tot_bultos,
        cod_tpo_bultos: e.cod_tpo_bultos,
        cant_bultos: e.cant_bultos,
        mnt_flete: e.mnt_flete,
        mnt_seguro: e.mnt_seguro,
        cod_pais_recep: e.cod_pais_recep,
        cod_pais_destin: e.cod_pais_destin,
      };
      payload.export = exportPayload;
    }

    // Referencias libres (MIC, DUS, B/L…) primero y la marca 'SET' al final:
    // el SII las numera en el orden recibido y la del set es la de cierre.
    const references = raw.references.map((r) => ({
      tipo_doc_ref: r.tipo_doc_ref,
      folio_ref: r.folio_ref,
      fecha_ref: r.fecha_ref,
      razon_ref: r.razon_ref || null,
    }));

    if (raw.includeSetReference && item?.attention_number && item?.case_number) {
      references.push({
        tipo_doc_ref: 'SET',
        folio_ref: 1,
        fecha_ref: raw.date,
        razon_ref: `CASO ${item.attention_number}-${item.case_number}`,
      });
    }

    if (references.length) {
      payload.document_references = references;
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
