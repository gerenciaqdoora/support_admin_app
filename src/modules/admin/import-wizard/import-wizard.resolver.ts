import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { ImportWizardService } from '@core/services/import-wizard.service';
import { ImportWizardOverview } from '@core/models/import-wizard.model';

export interface ImportWizardRouteData {
  companyId: number;
  overview: ImportWizardOverview | null;
  error: string | null;
}

/** Carga el catálogo de pasos antes de pintar la pantalla (SUPPORT_RULES, Hard Reject #7). */
export const importWizardResolver: ResolveFn<ImportWizardRouteData> = (route) => {
  const companyId = Number(route.paramMap.get('companyId'));

  return inject(ImportWizardService).overview(companyId).pipe(
    map((overview) => ({ companyId, overview, error: null })),
    catchError((err) => of({
      companyId, overview: null,
      error: (err?.error?.message as string | undefined) ?? 'No se pudo cargar el asistente de importaciones. Intente nuevamente.',
    })),
  );
};
