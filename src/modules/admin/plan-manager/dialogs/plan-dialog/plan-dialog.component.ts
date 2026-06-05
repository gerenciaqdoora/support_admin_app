import { Component, Inject, OnInit, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormArray, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PlanManagerService, Plan } from '../../services/plan-manager.service';
import { DialogHeaderComponent } from '../../../puc-manager/dialogs/shared/header/header.component';
import { DialogFooterComponent } from '../../../puc-manager/dialogs/shared/footer/footer.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../../../../../app/core/services/notification.service';
import { QdooraAlertService } from '../../../../../app/core/components/alert/alert.service';
import { QdooraSelectComponent } from '../../../../shared/qdoora-select/qdoora-select.component';
import { SharedInputComponent } from '../../../../shared/input/input.component';
import { QdooraCurrencyInputComponent } from '../../../../shared/currency-input/currency-input.component';
import { QdooraNumberStepperComponent } from '../../../../shared/number-stepper/number-stepper.component';
import { QdooraCheckboxComponent } from '../../../../shared/qdoora-checkbox/qdoora-checkbox.component';
import { QdooraTextareaComponent } from '../../../../shared/qdoora-textarea/qdoora-textarea.component';

@Component({
  selector: 'app-plan-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DialogHeaderComponent,
    DialogFooterComponent,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatIconModule,
    QdooraSelectComponent,
    SharedInputComponent,
    QdooraCurrencyInputComponent,
    QdooraNumberStepperComponent,
    QdooraCheckboxComponent,
    QdooraTextareaComponent
  ],
  templateUrl: './plan-dialog.component.html'
})
export class PlanDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private planService = inject(PlanManagerService);
  private notification = inject(NotificationService);
  private alertService = inject(QdooraAlertService);

  isEditMode = false;
  availableModules: { code: string; name: string }[] = [];

  // Dropdown options
  tierOptions = [
    { val: 'demo', label: 'Demo' },
    { val: 'basic', label: 'Básico' },
    { val: 'pro', label: 'Pro' }
  ];

  targetOptions = [
    { val: 'contador', label: 'Contador (Estudios)' },
    { val: 'empresa', label: 'Empresa (Directo)' },
    { val: 'all', label: 'Todos' }
  ];

  form = this.fb.group({
    slug: ['', Validators.required],
    name: ['', Validators.required],
    tier: ['pro', Validators.required],
    target: ['empresa', Validators.required],
    currency: ['CLP', Validators.required],
    base_price: [0, [Validators.required, Validators.min(0)]],
    base_user_quantity: [1, [Validators.required, Validators.min(1)]],
    base_company_quantity: [1, [Validators.required, Validators.min(1)]],
    is_public: [true],
    active: [true],
    notes: [''],
    modules: this.fb.array([])
  });

  constructor(
    public dialogRef: MatDialogRef<PlanDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { plan?: Plan }
  ) {
    if (this.data?.plan) {
      this.isEditMode = true;
      const planData = {
        ...this.data.plan,
        base_price: Number(this.data.plan.base_price)
      };
      this.form.patchValue(planData as any);
      // Slug is not updatable
      this.form.controls.slug.disable();
    }
  }

  ngOnInit() {
    if (!this.isEditMode) {
      this.loadModules();
    }
  }

  get modulesArray(): FormArray {
    return this.form.get('modules') as FormArray;
  }

  loadModules() {
    this.planService.getModules().subscribe(res => {
      this.availableModules = res.data;
      res.data.forEach(mod => {
        const group = this.fb.group({
          module_code: [mod.code, Validators.required],
          included: [mod.is_core], // Default true si es core
          addon_price: [0]
        });

        group.get('included')?.valueChanges.subscribe(isIncluded => {
          if (isIncluded) {
            group.get('addon_price')?.setValue(0);
          }
        });

        this.modulesArray.push(group);
      });
    });
  }

  save() {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue();

    if (this.isEditMode) {
      const payload = {
        name: raw.name ?? undefined,
        tier: raw.tier ?? undefined,
        target: raw.target ?? undefined,
        currency: raw.currency ?? undefined,
        base_price: Number(raw.base_price),
        base_user_quantity: Number(raw.base_user_quantity),
        base_company_quantity: Number(raw.base_company_quantity),
        is_public: raw.is_public ?? undefined,
        active: raw.active ?? undefined,
        notes: raw.notes ?? undefined
      };

      this.planService.updatePlan(this.data.plan!.id, payload).subscribe({
        next: () => {
          this.notification.show('Plan actualizado con éxito');
          this.dialogRef.close(true);
        },
        error: () => this.alertService.showAlert({ appearance: 'outline', type: 'error', message: 'Error al actualizar', name: 'err' })
      });
    } else {
      const payload = {
        slug: raw.slug ?? '',
        name: raw.name ?? '',
        tier: raw.tier ?? '',
        target: raw.target ?? '',
        currency: raw.currency ?? '',
        base_price: Number(raw.base_price),
        base_user_quantity: Number(raw.base_user_quantity),
        base_company_quantity: Number(raw.base_company_quantity),
        is_public: !!raw.is_public,
        active: !!raw.active,
        notes: raw.notes ?? undefined,
        modules: (raw.modules as any[] || []).map(m => ({
          module_code: m.module_code,
          included: !!m.included,
          addon_price: Number(m.addon_price)
        }))
      };

      this.planService.createPlan(payload).subscribe({
        next: () => {
          this.notification.show('Plan creado con éxito');
          this.dialogRef.close(true);
        },
        error: () => this.alertService.showAlert({ appearance: 'outline', type: 'error', message: 'Error al crear', name: 'err' })
      });
    }
  }
}
