import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { finalize } from 'rxjs';
import { GrantAddonPayload, SubscriberService } from '@core/services/subscriber.service';
import { NotificationService } from '@core/services/notification.service';
import { DialogHeaderComponent } from '../../../admin/puc-manager/dialogs/shared/header/header.component';
import { DialogFooterComponent } from '../../../admin/puc-manager/dialogs/shared/footer/footer.component';
import { QdooraSelectComponent } from '../../../shared/qdoora-select/qdoora-select.component';
import { QdooraNumberStepperComponent } from '../../../shared/number-stepper/number-stepper.component';
import { QdooraTextareaComponent } from '../../../shared/qdoora-textarea/qdoora-textarea.component';
import { capacityPreview } from '../../capacity-preview';

export interface GrantAddonDialogData {
  subscriberId: number;
  aduanaCapped: boolean;
  current: Record<GrantAddonPayload['dimension'], { limit: number; usage: number }>;
}

/** Suma cupos permanentes de usuarios o empresas al plan vigente, mostrando el antes y el después. */
@Component({
  selector: 'app-grant-addon-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule, MatButtonModule, DialogHeaderComponent, DialogFooterComponent,
    QdooraSelectComponent, QdooraNumberStepperComponent, QdooraTextareaComponent,
  ],
  templateUrl: './grant-addon-dialog.component.html',
})
export class GrantAddonDialogComponent {
  private fb = inject(FormBuilder);
  private subscriberService = inject(SubscriberService);
  private notification = inject(NotificationService);
  dialogRef = inject(MatDialogRef<GrantAddonDialogComponent>);
  data = inject<GrantAddonDialogData>(MAT_DIALOG_DATA);

  isSaving = signal(false);
  // Con Aduana no se dan cupos de empresas: el plan permite una sola
  dimensionOptions = [
    { val: 'users', label: 'Usuarios' },
    ...(this.data.aduanaCapped ? [] : [{ val: 'companies', label: 'Empresas' }]),
  ];

  form = this.fb.nonNullable.group({
    dimension: ['users' as GrantAddonPayload['dimension'], Validators.required],
    quantity: [1, [Validators.required, Validators.min(1), Validators.max(1000)]],
    reason: ['', [Validators.required, Validators.maxLength(255)]],
  });

  private dimension = toSignal(this.form.controls.dimension.valueChanges, { initialValue: this.form.controls.dimension.value });
  private quantity = toSignal(this.form.controls.quantity.valueChanges, { initialValue: this.form.controls.quantity.value });

  dimensionLabel = computed(() => (this.dimension() === 'users' ? 'Usuarios' : 'Empresas'));
  preview = computed(() => capacityPreview(this.data.current[this.dimension()], Number(this.quantity())));

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const payload: GrantAddonPayload = { dimension: raw.dimension, quantity: Number(raw.quantity), reason: raw.reason };
    const { before, after } = this.preview();
    const label = this.dimensionLabel().toLowerCase();

    this.isSaving.set(true);
    this.subscriberService
      .grantAddon(this.data.subscriberId, payload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.notification.success(`Cupo otorgado: ${label} permitidos ${before} → ${after}.`);
          this.dialogRef.close(true);
        },
        error: (err) => this.notification.warning(err.error?.message ?? 'No se pudo otorgar el cupo.'),
      });
  }
}
