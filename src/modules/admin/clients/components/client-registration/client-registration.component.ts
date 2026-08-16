import { Component, OnInit, inject, signal, computed, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { ClientManagementService } from '../../services/client-management.service';
import { QdooraAlertService } from '../../../../../app/core/components/alert/alert.service';
import { NotificationService } from '../../../../../app/core/services/notification.service';
import { CreateClientPayload } from '../../interfaces/client.interface';
import { DialogHeaderComponent } from '../../../puc-manager/dialogs/shared/header/header.component';
import { DialogFooterComponent } from '../../../puc-manager/dialogs/shared/footer/footer.component';
import { SharedInputComponent } from '@modules/shared/input/input.component';
import { SharedAlertComponent } from '@modules/shared/alert/alert.component';
import { PlanManagerService, Plan } from '../../../plan-manager/services/plan-manager.service';
import { QdooraSelectComponent } from '@modules/shared/qdoora-select/qdoora-select.component';

@Component({
  selector: 'app-client-registration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogHeaderComponent,
    DialogFooterComponent,
    SharedInputComponent,
    SharedAlertComponent,
    MatIconModule,
    QdooraSelectComponent
  ],
  templateUrl: './client-registration.component.html',
  styles: [
    `
      .dialog-panel {
        width: 95vw;
        max-width: 95vw;

        @media (min-width: 640px) {
          width: 32rem; /* w-128 */
          max-width: 32rem;
        }

        @media (min-width: 1024px) {
          width: 60rem; /* w-240 */
          max-width: 60rem;
        }

        .mat-mdc-dialog-container {
          .mat-mdc-dialog-surface {
            padding: 0 !important;
            border-radius: 13px !important;
            overflow: hidden !important;
          }
        }
      }
    `
  ],
  encapsulation: ViewEncapsulation.None
})
export class ClientRegistrationComponent implements OnInit, OnDestroy {
  readonly alertName = 'ClientRegistrationAlert';

  getModuleIcon(code: string): string {
    const icons: Record<string, string> = {
      'CONTABILIDAD': 'heroicons_outline:calculator',
      'FACTURACION': 'heroicons_outline:document-text',
      'NOMINA': 'heroicons_outline:currency-dollar',
      'VENTA': 'heroicons_outline:shopping-cart',
      'TREASURY': 'heroicons_outline:credit-card',
      'ADUANA': 'heroicons_outline:globe-alt'
    };
    return icons[code] || 'heroicons_outline:cube';
  }

  getModuleDescription(code: string): string {
    const descriptions: Record<string, string> = {
      'CONTABILIDAD': 'Contabilidad general, Balances, IFRS y centralización automática.',
      'FACTURACION': 'Facturación electrónica, DTEs, guías de despacho e integración SII.',
      'NOMINA': 'Gestión de empleados, cálculo de remuneraciones y Previred.',
      'VENTA': 'Punto de venta, control de boletas, facturas de venta y cobranza.',
      'TREASURY': 'Conciliación bancaria, egresos, ingresos y control de flujos de caja.',
      'ADUANA': 'Tramitación aduanera completa, DIN, DUS y carpetas electrónicas.'
    };
    return descriptions[code] || 'Módulo complementario para la gestión del negocio.';
  }
  private fb = inject(FormBuilder);
  private clientService = inject(ClientManagementService);
  private planService = inject(PlanManagerService);
  private alertService = inject(QdooraAlertService);
  private notificationService = inject(NotificationService);
  private dialogRef = inject(MatDialogRef<ClientRegistrationComponent>);
  private router = inject(Router);

  /** Ruta única habilitada para dar de alta suscriptores con módulo Aduana */
  readonly customsRegistrationRoute = '/admin/customs-subscriber/create';

  readonly isLoading = signal(false);
  readonly isLoadingPlans = signal(false);
  readonly availablePlans = signal<Plan[]>([]);
  readonly selectedPlan = signal<Plan | null>(null);

  /**
   * Un plan que incluye el módulo Aduana no puede provisionarse desde aquí: la
   * agencia requiere agente del Anexo 51, empresa y PUC de agencia, que sólo el
   * alta de Suscriptores Aduana sabe construir. Si Aduana figura sólo como
   * addon, el alta no la activa y el plan sí puede contratarse por esta vía.
   */
  readonly hasCustomsModule = computed(() =>
    (this.selectedPlan()?.modules ?? []).some(module => module.code === 'ADUANA' && module.pivot?.included)
  );

  readonly form: FormGroup = this.fb.group({
    first_name: ['', [Validators.required, Validators.maxLength(255)]],
    last_name: ['', [Validators.required, Validators.maxLength(255)]],
    dni: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    plan_id: [null, Validators.required]
  });

  ngOnInit() {
    this.loadPlans();

    this.form.get('plan_id')?.valueChanges.subscribe(planId => {
      const plan = this.availablePlans().find(p => p.id === planId);
      this.selectedPlan.set(plan || null);
    });
  }

  ngOnDestroy() {
    // Evitar fugas de alertas si el modal se cierra abruptamente
    this.alertService.clearAlert('ClientRegistrationAlert');
  }

  close() {
    this.dialogRef.close();
  }

  /** Deriva al único flujo habilitado para planes con módulo Aduana */
  goToCustomsRegistration() {
    this.dialogRef.close();
    this.router.navigate([this.customsRegistrationRoute]);
  }

  private loadPlans() {
    this.isLoadingPlans.set(true);
    this.planService.getPlans()
      .pipe(finalize(() => this.isLoadingPlans.set(false)))
      .subscribe({
        next: (response) => {
          this.availablePlans.set(response.data.plans || []);
        },
        error: (err) => {
          this.alertService.showAlert({
            appearance: 'outline',
            type: 'error',
            name: 'ClientRegistrationAlert',
            message: 'No se pudieron cargar los planes disponibles.'
          });
        }
      });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    // Bloqueo Aduana: el backend también lo rechaza, esto evita el viaje inútil
    if (this.hasCustomsModule()) {
      this.alertService.showAlert({
        appearance: 'outline',
        type: 'error',
        name: this.alertName,
        message: 'Los planes con módulo Aduana no se habilitan por esta vía. Use el alta de Suscriptores Aduana.'
      });
      return;
    }

    this.isLoading.set(true);
    this.alertService.clearAlert('ClientRegistrationAlert');

    const payload: CreateClientPayload = this.form.value;

    this.clientService.provisionClient(payload)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.notificationService.success(res.message || 'Alta exitosa', [], 'Cliente provisionado');
          this.dialogRef.close(true);
        },
        error: (err) => {
          // El interceptor se encargará de errores generales, pero podemos manejar específicos aquí si se requiere
        }
      });
  }
}
