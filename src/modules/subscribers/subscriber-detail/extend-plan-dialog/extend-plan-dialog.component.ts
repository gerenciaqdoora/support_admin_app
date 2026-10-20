import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { finalize } from 'rxjs';
import { SubscriberService } from '@core/services/subscriber.service';
import { NotificationService } from '@core/services/notification.service';
import { DialogHeaderComponent } from '../../../admin/puc-manager/dialogs/shared/header/header.component';
import { DialogFooterComponent } from '../../../admin/puc-manager/dialogs/shared/footer/footer.component';
import { SharedInputComponent } from '../../../shared/input/input.component';
import { QdooraTextareaComponent } from '../../../shared/qdoora-textarea/qdoora-textarea.component';

export interface ExtendPlanDialogData {
  subscriberId: number;
  ownerLabel: string;
  status: string | null;
}

/** Extiende el vencimiento del plan actual; si estaba en gracia o suspendido, lo reactiva. */
@Component({
  selector: 'app-extend-plan-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, MatButtonModule, DialogHeaderComponent, DialogFooterComponent, SharedInputComponent, QdooraTextareaComponent],
  templateUrl: './extend-plan-dialog.component.html',
})
export class ExtendPlanDialogComponent {
  private fb = inject(FormBuilder);
  private subscriberService = inject(SubscriberService);
  private notification = inject(NotificationService);
  dialogRef = inject(MatDialogRef<ExtendPlanDialogComponent>);
  data = inject<ExtendPlanDialogData>(MAT_DIALOG_DATA);

  isSaving = signal(false);
  reactivates = this.data.status === 'past_due' || this.data.status === 'suspended';

  form = this.fb.nonNullable.group({
    ends_at: ['', Validators.required],
    reason: ['', [Validators.required, Validators.maxLength(255)]],
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSaving.set(true);
    this.subscriberService
      .extendPlan(this.data.subscriberId, this.form.getRawValue())
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: () => {
          this.notification.success('Plazo extendido.');
          this.dialogRef.close(true);
        },
        error: (err) => this.notification.warning(err.error?.message ?? 'No se pudo extender el plazo.'),
      });
  }
}
