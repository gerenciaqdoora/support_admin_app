import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlanManagerService, Plan } from './services/plan-manager.service';
import { MatDialog } from '@angular/material/dialog';
import { PlanDialogComponent } from './dialogs/plan-dialog/plan-dialog.component';
import { DiscountDialogComponent } from './dialogs/discount-dialog/discount-dialog.component';
import { QdooraAlertService } from '../../../app/core/components/alert/alert.service';
import { NotificationService } from '../../../app/core/services/notification.service';
import { finalize } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-plan-manager',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './plan-manager.component.html'
})
export class PlanManagerComponent implements OnInit {
  private planService = inject(PlanManagerService);
  private dialog = inject(MatDialog);
  private alertService = inject(QdooraAlertService);
  private notification = inject(NotificationService);

  plans = signal<Plan[]>([]);
  isLoading = signal<boolean>(false);

  ngOnInit() {
    this.loadPlans();
  }

  getTierLabel(value: string | null | undefined): string {
    const mapping: Record<string, string> = {
      'demo': 'Demo',
      'basic': 'Básico',
      'pro': 'Pro'
    };
    return value ? (mapping[value] || value) : '';
  }

  getTargetLabel(value: string | null | undefined): string {
    const mapping: Record<string, string> = {
      'contador': 'Contador',
      'empresa': 'Empresa',
      'all': 'Todos'
    };
    return value ? (mapping[value] || value) : '';
  }

  loadPlans() {
    this.isLoading.set(true);
    this.planService.getPlans()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => this.plans.set(res.data.plans),
        error: () => this.alertService.showAlert({
          appearance: 'outline',
          type: 'error',
          message: 'Error al cargar los planes.',
          name: 'plan_load_error'
        })
      });
  }

  openPlanDialog(plan?: Plan) {
    const dialogRef = this.dialog.open(PlanDialogComponent, {
      panelClass: 'dialog-panel',
      data: { plan }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadPlans();
      }
    });
  }

  openDiscountDialog() {
    this.dialog.open(DiscountDialogComponent, {
      panelClass: 'dialog-panel'
    });
  }

  deprecatePlan(plan: Plan) {
    // In a real scenario, we might want to ask for a reason first using another dialog.
    // For simplicity, we just pass a default reason here or we could prompt.
    const reason = window.prompt('Razón para deprecar este plan:');
    if (!reason) return;

    this.planService.deprecatePlan(plan.id, { reason })
      .subscribe({
        next: () => {
          this.notification.show('Plan deprecado exitosamente');
          this.loadPlans();
        },
        error: () => this.alertService.showAlert({
          appearance: 'outline',
          type: 'error',
          message: 'Error al deprecar el plan.',
          name: 'plan_deprecate_error'
        })
      });
  }
}
