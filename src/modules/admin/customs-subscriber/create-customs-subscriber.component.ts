import { Component, inject, signal, ViewChild, ElementRef, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminCustomsService } from '../../../app/core/services/admin-customs.service';
import { AduanaSubscriberData, AduanaAgent } from '../../../app/core/models/aduana-subscriber.model';
import { AccountPlanImportRow, AccountPlanPreview, AccountPlanPreviewNode } from '../../../app/core/models/account-plan-import.model';
import { AccountPlanExcelParserService } from '../../../app/core/services/account-plan-excel-parser.service';
import { RutFormatPipe } from '../../../app/core/pipes/rut-format.pipe';
import { Router, RouterLink } from '@angular/router';
import { OnInit } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { PlanManagerService, Plan } from '@modules/admin/plan-manager/services/plan-manager.service';
import { QdooraSelectComponent } from '@modules/shared/qdoora-select/qdoora-select.component';

@Component({
  selector: 'app-create-customs-subscriber',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, QdooraSelectComponent],
  templateUrl: './create-customs-subscriber.component.html',
})
export class CreateCustomsSubscriberComponent {
  private _fb = inject(FormBuilder);
  private _adminService = inject(AdminCustomsService);
  private _planService = inject(PlanManagerService);
  private _router = inject(Router);
  private _excelParser = inject(AccountPlanExcelParserService);

  @ViewChild('alertContainer') alertContainer!: ElementRef;
  @ViewChild('excelFileInput') excelFileInput?: ElementRef<HTMLInputElement>;

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  notification = signal<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  validationErrors = signal<string[]>([]);
  aduanaAgents = signal<AduanaAgent[]>([]);

  // Planes vigentes que incluyen el módulo Aduana (única vía de habilitación)
  isLoadingPlans = signal(false);
  customsPlans = signal<Plan[]>([]);
  selectedPlan = signal<Plan | null>(null);

  // Importación del plan de cuentas
  excelFile = signal<File | null>(null);
  excelRows = signal<AccountPlanImportRow[]>([]);
  excelErrors = signal<string[]>([]);
  preview = signal<AccountPlanPreview | null>(null);
  isPreviewing = signal(false);

  // Dropdown Management
  activeDropdown = signal<string | null>(null);
  agentSearch = signal('');

  filteredAgents = computed(() => {
    const search = this.agentSearch().toLowerCase().replace(/-/g, '').trim();
    const list = this.aduanaAgents();
    if (!search) return list;
    return list.filter(a => {
      const normalizedName = a.name.toLowerCase().replace(/-/g, '');
      const normalizedCode = a.code.toLowerCase().replace(/-/g, '');
      return normalizedName.includes(search) || normalizedCode.includes(search);
    });
  });

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    this.activeDropdown.set(null);
  }

  form: FormGroup = this._fb.group({
    // Plan Data
    plan_id: [null, Validators.required],

    // User Data
    first_name: ['', Validators.required],
    last_name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    dni: ['', Validators.required],

    // Company Data
    social_reason: ['', Validators.required],
    rut: ['', Validators.required],
    aduana_anexo51_agent_id: ['', Validators.required],
    agent_name: [{ value: '', disabled: true }, Validators.required],
    agent_code: [{ value: '', disabled: true }, Validators.required],
    address: [''],
    phone: [''],

    // Plan de Cuentas (importación desde archivo del cliente).
    // El largo del tipo es siempre 1 dígito — no es editable, así que no
    // forma parte del form. La clase de cada dígito la declara el archivo
    // (columna "Clase Cuenta"), no una convención fija.
    account_plan_name: ['Plan de Cuentas Aduana', Validators.required],
    largo_subtipo: [3, [Validators.required, Validators.min(1), Validators.max(10)]],
    largo_cuenta: [3, [Validators.required, Validators.min(1), Validators.max(10)]],
    largo_subcuenta: [3, [Validators.required, Validators.min(1), Validators.max(10)]],
  });

  /** El código del tipo vive en un varchar(1): el largo del tipo es siempre 1. */
  readonly LARGO_TIPO = 1;

  ngOnInit() {
    this.loadAgents();
    this.loadCustomsPlans();

    this.form.get('plan_id')?.valueChanges.subscribe((planId) => {
      this.selectedPlan.set(this.customsPlans().find((plan) => plan.id === planId) ?? null);
    });
  }

  loadAgents() {
    this._adminService.getAduanaAgents().subscribe({
      next: (agents) => this.aduanaAgents.set(agents),
      error: () => this.errorMessage.set('Error al cargar catálogo de agentes.')
    });
  }

  /** Sólo planes vigentes con módulo Aduana incluido: el backend rechaza cualquier otro */
  loadCustomsPlans() {
    this.isLoadingPlans.set(true);
    this._planService.getCustomsPlans()
      .pipe(finalize(() => this.isLoadingPlans.set(false)))
      .subscribe({
        next: (response) => this.customsPlans.set(response.data.plans || []),
        error: () => this.errorMessage.set('Error al cargar los planes con módulo Aduana.')
      });
  }

  /** Lee el archivo elegido y extrae el listado plano de cuentas (sin interpretar jerarquía aún). */
  async onExcelSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    this.preview.set(null);
    this.excelErrors.set([]);
    this.excelRows.set([]);
    this.excelFile.set(file);

    if (!file) return;

    const result = await this._excelParser.parse(file);
    this.excelRows.set(result.rows);
    this.excelErrors.set(result.errors);
  }

  /** Reinicia el proceso de importación para adjuntar otro archivo desde cero. */
  clearExcelPlan() {
    this.excelFile.set(null);
    this.excelRows.set([]);
    this.excelErrors.set([]);
    this.preview.set(null);

    // Sin esto, seleccionar el mismo archivo de nuevo no dispara (change).
    if (this.excelFileInput) {
      this.excelFileInput.nativeElement.value = '';
    }
  }

  /** Largos por nivel tal como los declara el operador (tipo siempre 1). */
  private currentLargos(): number[] {
    return [
      this.LARGO_TIPO,
      Number(this.form.value.largo_subtipo),
      Number(this.form.value.largo_cuenta),
      Number(this.form.value.largo_subcuenta),
    ];
  }

  /** Pide al backend la interpretación del archivo con los largos declarados. */
  generatePreview() {
    const rows = this.excelRows();
    if (!rows.length) {
      this.excelErrors.set(['Debe cargar un archivo con cuentas antes de previsualizar.']);
      return;
    }

    this.isPreviewing.set(true);
    this._adminService.previewAccountPlan({ largos: this.currentLargos(), rows })
      .pipe(finalize(() => this.isPreviewing.set(false)))
      .subscribe({
        next: (preview) => {
          this.preview.set(preview);
          this.excelErrors.set([]);
        },
        error: (error) => {
          this.preview.set(null);
          this.excelErrors.set([error.error?.message || 'No se pudo interpretar el archivo.']);
        },
      });
  }

  /**
   * Filas a mostrar en la tabla de detalle de la previsualización.
   *
   * El archivo puede aterrizar en cualquier nivel según los largos que
   * declare el operador (`tree.level`). Cuando aterriza en 'subcuenta', las
   * filas reales —con su sigla y configuración— viven en `tree.subcuentas`;
   * `tree.cuentas` solo trae los nodos padre generados automáticamente
   * (nombre genérico, sin configuración). Mostrar siempre `tree.cuentas`
   * ocultaría al operador lo que realmente se va a importar.
   */
  previewNodes = computed<AccountPlanPreviewNode[]>(() => {
    const tree = this.preview();
    if (!tree) return [];

    switch (tree.level) {
      case 'subcuenta': return tree.subcuentas;
      case 'cuenta': return tree.cuentas;
      case 'subtipo': return tree.subtipos;
      case 'tipo': return tree.tipos;
    }
  });

  /** Módulos que el plan seleccionado trae incluidos */
  includedModules(plan: Plan) {
    return (plan.modules ?? []).filter((module) => module.pivot?.included);
  }

  toggleDropdown(name: string, event: MouseEvent) {
    event.stopPropagation();
    this.activeDropdown.set(this.activeDropdown() === name ? null : name);
  }

  selectAgent(agent: AduanaAgent) {
    this.form.patchValue({
      aduana_anexo51_agent_id: agent.id,
      agent_name: agent.name,
      agent_code: agent.code
    });
    this.activeDropdown.set(null);
    this.agentSearch.set('');
  }

  formatRut(event: any, field: string) {
    let value = event.target.value.replace(/\./g, '').replace('-', '');
    if (value.length > 1) {
      const dv = value.slice(-1);
      const cuerpo = value.slice(0, -1);
      const formatted = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + '-' + dv;
      this.form.get(field)?.setValue(formatted, { emitEvent: false });
    }
  }

  showNotification(message: string, type: 'success' | 'error' | 'info' = 'success') {
    this.notification.set({ message, type });
    setTimeout(() => this.notification.set(null), 4000);
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (!this.preview()) {
      this.errorMessage.set('Debe previsualizar el plan de cuentas antes de crear el suscriptor.');
      this.scrollToAlert();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.validationErrors.set([]);

    const raw = this.form.getRawValue();
    const data: AduanaSubscriberData = {
      ...raw,
      name: this.form.value.email, // Usamos el email como nombre de usuario por defecto
      dni: this.form.get('dni')?.value.replace(/\./g, '').replace('-', ''),
      rut: this.form.get('rut')?.value.replace(/\./g, '').replace('-', ''),
      largos: this.currentLargos() as [number, number, number, number],
      rows: this.excelRows(),
    };

    this._adminService.createAduanaSubscriber(data).subscribe({
      next: (response: any) => {
        this.isLoading.set(false);
        this.showNotification(response.message);
        this.form.reset();
        this.excelFile.set(null);
        this.excelRows.set([]);
        this.excelErrors.set([]);
        this.preview.set(null);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Ocurrió un error al crear el suscriptor.');
        
        // Extract granular validation errors if present
        if (error.error?.errors) {
          const errors = Object.values(error.error.errors).flat() as string[];
          this.validationErrors.set(errors);
        }

        this.scrollToAlert();
      }
    });
  }

  private scrollToAlert() {
    setTimeout(() => {
      this.alertContainer.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  }
}
