import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { PucManagerComponent } from './puc-manager.component';
import { PucManagerService } from '@core/services/puc-manager.service';

export default [
  {
    path: '',
    component: PucManagerComponent,
    resolve: {
      accountPlanData: () => inject(PucManagerService).getAccountPlanDataFull(),
      accountCategories: () => inject(PucManagerService).getAccountCategories(),
      ifrsAccounts: () => inject(PucManagerService).getIfrsAccount(),
    }
  }
] as Routes;
