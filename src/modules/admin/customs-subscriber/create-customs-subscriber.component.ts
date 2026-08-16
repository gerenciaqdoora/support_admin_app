import { Component, inject, signal, ViewChild, ElementRef, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminCustomsService } from '../../../app/core/services/admin-customs.service';
import { AduanaSubscriberData, AduanaAgent } from '../../../app/core/models/aduana-subscriber.model';
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

  @ViewChild('alertContainer') alertContainer!: ElementRef;

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  notification = signal<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  validationErrors = signal<string[]>([]);
  aduanaAgents = signal<AduanaAgent[]>([]);

  // Planes vigentes que incluyen el módulo Aduana (única vía de habilitación)
  isLoadingPlans = signal(false);
  customsPlans = signal<Plan[]>([]);
  selectedPlan = signal<Plan | null>(null);

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
  });

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

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.validationErrors.set([]);

    const data: AduanaSubscriberData = {
      ...this.form.getRawValue(),
      name: this.form.value.email, // Usamos el email como nombre de usuario por defecto
      dni: this.form.get('dni')?.value.replace(/\./g, '').replace('-', ''),
      rut: this.form.get('rut')?.value.replace(/\./g, '').replace('-', ''),
    };

    this._adminService.createAduanaSubscriber(data).subscribe({
      next: (response: any) => {
        this.isLoading.set(false);
        this.showNotification(response.message);
        this.form.reset();
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
