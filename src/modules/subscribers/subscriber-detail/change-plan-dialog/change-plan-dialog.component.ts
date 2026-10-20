import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { finalize } from 'rxjs';
import { ChangePlanPayload, SubscriberService } from '@core/services/subscriber.service';
import { NotificationService } from '@core/services/notification.service';
import { Plan, PlanManagerService } from '../../../admin/plan-manager/services/plan-manager.service';
import { DialogHeaderComponent } from '../../../admin/puc-manager/dialogs/shared/header/header.component';
import { DialogFooterComponent } from '../../../admin/puc-manager/dialogs/shared/footer/footer.component';
import { QdooraSelectComponent } from '../../../shared/qdoora-select/qdoora-select.component';
import { SharedInputComponent } from '../../../shared/input/input.component';
import { QdooraTextareaComponent } from '../../../shared/qdoora-textarea/qdoora-textarea.component';

export interface ChangePlanDialogData {
  subscriberId: number;
  currentPlanSlug: string | null;
}

/** Cambio de plan operado por un admin: el plan actual queda en el historial (superseded). */
@Component({
  selector: 'app-change-plan-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    DialogHeaderComponent,
    DialogFooterComponent,
    QdooraSelectComponent,
    SharedInputComponent,
    QdooraTextareaComponent,
  ],
  templateUrl: './change-plan-dialog.component.html',
})
export class ChangePlanDialogComponent {
  private fb = inject(FormBuilder);
  private planService = inject(PlanManagerService);
  private subscriberService = inject(SubscriberService);
  private notification = inject(NotificationService);
  dialogRef = inject(MatDialogRef<ChangePlanDialogComponent>);
  data = inject<ChangePlanDialogData>(MAT_DIALOG_DATA);

  plans = signal<Plan[]>([]);
  isLoading = signal(true);
  isSaving = signal(false);

  form = this.fb.nonNullable.group({
    plan_slug: [this.data.currentPlanSlug ?? '', Validators.required],
    user_tier_code: [''],
    company_tier_code: [''],
    ends_at: [''],
    reason: ['', [Validators.required, Validators.maxLength(255)]],
  });

  private selectedSlug = toSignal(this.form.controls.plan_slug.valueChanges, {
    initialValue: this.form.controls.plan_slug.value,
  });
  planOptions = computed(() => this.plans().map((p) => ({ val: p.slug, label: `${p.name} (${p.tier})` })));
  private selectedPlan = computed(() => this.plans().find((p) => p.slug === this.selectedSlug()) ?? null);
  userTierOptions = computed(() => this.tierOptions('users'));
  companyTierOptions = computed(() => this.tierOptions('companies'));

  constructor() {
    this.planService
      .getPlans()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => this.plans.set(res.data.plans.filter((p) => p.active && !p.deprecated_at)),
        error: () => this.notification.warning('No se pudieron cargar los planes.'),
      });
    // Al cambiar de plan, los tramos elegidos dejan de ser válidos
    this.form.controls.plan_slug.valueChanges.subscribe(() =>
      this.form.patchValue({ user_tier_code: '', company_tier_code: '' }, { emitEvent: false })
    );
  }

  private tierOptions(dimension: 'users' | 'companies') {
    return (this.selectedPlan()?.quantity_tiers ?? [])
      .filter((t) => t.dimension === dimension)
      .map((t) => ({
        val: t.code,
        label: `${t.name} (${t.min_qty}–${t.max_qty})${t.pivot?.is_default ? ' · por defecto' : ''}`,
      }));
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const payload: ChangePlanPayload = {
      plan_slug: raw.plan_slug,
      reason: raw.reason,
      user_tier_code: raw.user_tier_code || undefined,
      company_tier_code: raw.company_tier_code || undefined,
      ends_at: raw.ends_at || undefined,
    };

    this.isSaving.set(true);
    this.subscriberService
      .changePlan(this.data.subscriberId, payload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.notification.success('Plan actualizado.');
          this.dialogRef.close(true);
        },
        error: (err) => this.notification.warning(err.error?.message ?? 'No se pudo cambiar el plan.'),
      });
  }
}
