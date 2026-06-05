import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { PlanManagerService } from '../../services/plan-manager.service';
import { DialogHeaderComponent } from '../../../puc-manager/dialogs/shared/header/header.component';
import { DialogFooterComponent } from '../../../puc-manager/dialogs/shared/footer/footer.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { NotificationService } from '../../../../../app/core/services/notification.service';
import { QdooraAlertService } from '../../../../../app/core/components/alert/alert.service';

@Component({
  selector: 'app-discount-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    DialogHeaderComponent,
    DialogFooterComponent,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule
  ],
  templateUrl: './discount-dialog.component.html'
})
export class DiscountDialogComponent {
  private fb = inject(FormBuilder);
  private planService = inject(PlanManagerService);
  private notification = inject(NotificationService);
  private alertService = inject(QdooraAlertService);

  form = this.fb.group({
    code: ['', Validators.required],
    type: ['PERCENTAGE', Validators.required],
    value: [0, [Validators.required, Validators.min(0)]],
    max_uses: [null],
    active: [true],
    expires_at: [null]
  });

  constructor(public dialogRef: MatDialogRef<DiscountDialogComponent>) {}

  save() {
    if (this.form.invalid) return;

    this.planService.createDiscountCode(this.form.getRawValue()).subscribe({
      next: () => {
        this.notification.show('Código creado con éxito');
        this.dialogRef.close(true);
      },
      error: () => this.alertService.showAlert({ appearance: 'outline', type: 'error', message: 'Error al crear código', name: 'err' })
    });
  }
}
