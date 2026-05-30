import { Component, OnInit, inject, signal, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { finalize } from 'rxjs/operators';
import { ClientManagementService } from '../../services/client-management.service';
import { QdooraAlertService } from '../../../../../app/core/components/alert/alert.service';
import { NotificationService } from '../../../../../app/core/services/notification.service';
import { CreateClientPayload } from '../../interfaces/client.interface';
import { DialogHeaderComponent } from '../../../puc-manager/dialogs/shared/header/header.component';
import { DialogFooterComponent } from '../../../puc-manager/dialogs/shared/footer/footer.component';
import { SharedInputComponent } from '@modules/shared/input/input.component';
import { SharedAlertComponent } from '@modules/shared/alert/alert.component';

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
    MatIconModule
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
  private alertService = inject(QdooraAlertService);
  private notificationService = inject(NotificationService);
  private dialogRef = inject(MatDialogRef<ClientRegistrationComponent>);

  readonly isLoading = signal(false);
  readonly isLoadingModules = signal(false);
  readonly availableModules = signal<any[]>([]);

  readonly form: FormGroup = this.fb.group({
    first_name: ['', [Validators.required, Validators.maxLength(255)]],
    last_name: ['', [Validators.required, Validators.maxLength(255)]],
    dni: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    modules: this.fb.array([], Validators.required)
  });

  get modulesFormArray(): FormArray {
    return this.form.get('modules') as FormArray;
  }

  ngOnInit() {
    this.loadModules();
  }

  ngOnDestroy() {
    // Evitar fugas de alertas si el modal se cierra abruptamente
    this.alertService.clearAlert('ClientRegistrationAlert');
  }

  close() {
    this.dialogRef.close();
  }

  private loadModules() {
    this.isLoadingModules.set(true);
    this.clientService.getAvailableModules()
      .pipe(finalize(() => this.isLoadingModules.set(false)))
      .subscribe({
        next: (response) => {
          this.availableModules.set(response.data || []);
        },
        error: (err) => {
          this.alertService.showAlert({
            appearance: 'outline',
            type: 'error',
            name: 'ClientRegistrationAlert',
            message: 'No se pudieron cargar los módulos disponibles.'
          });
        }
      });
  }

  onModuleToggle(moduleCode: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      this.modulesFormArray.push(this.fb.group({ code: [moduleCode] }));
    } else {
      const index = this.modulesFormArray.controls.findIndex(c => c.value.code === moduleCode);
      if (index !== -1) {
        this.modulesFormArray.removeAt(index);
      }
    }
  }

  isModuleSelected(moduleCode: string): boolean {
    return this.modulesFormArray.controls.some(c => c.value.code === moduleCode);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.modulesFormArray.length === 0) {
      this.alertService.showAlert({
        appearance: 'outline',
        type: 'warning',
        name: 'ClientRegistrationAlert',
        message: 'Debe seleccionar al menos un módulo para el cliente.'
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
