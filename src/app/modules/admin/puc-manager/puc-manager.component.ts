import { Component, ChangeDetectionStrategy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { AccountPlanTreeGridComponent } from './components/account-plan-tree-grid/account-plan-tree-grid.component';

@Component({
  selector: 'app-puc-manager',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, AccountPlanTreeGridComponent],
  template: `
    <div class="flex flex-col flex-auto min-w-0 h-full">
      <div class="flex flex-col sm:flex-row flex-0 sm:items-center sm:justify-between p-6 sm:pb-2 sm:pt-6 sm:px-10 dark:bg-transparent">
        <div class="flex-1 min-w-0">
          <div class="flex flex-wrap items-center font-medium text-secondary">
            <div>Configuración Global</div>
          </div>
          <div class="mt-2 text-3xl font-bold tracking-tight leading-8 truncate">
            Gestor Plan Único de Cuentas (PUC)
          </div>
        </div>
      </div>
      <div class="flex-auto p-6 sm:p-10 w-full mx-auto">
        <app-account-plan-tree-grid></app-account-plan-tree-grid>
      </div>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PucManagerComponent {
}
