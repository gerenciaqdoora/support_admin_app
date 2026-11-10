import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { ConsigneeImportService } from '@core/services/consignee-import.service';
import { ConsigneeImportRequirements, ConsigneeImportSession } from '@core/models/consignee-import.model';

export interface ConsigneeImportRouteData {
  companyId: number;
  requirements: ConsigneeImportRequirements;
  session: ConsigneeImportSession | null;
}

/** Resuelve requisitos y sesión activa antes de pintar la pantalla (SUPPORT_RULES, Hard Reject #7). */
export const consigneeImportResolver: ResolveFn<ConsigneeImportRouteData> = (route) => {
  const companyId = Number(route.paramMap.get('companyId'));
  const api = inject(ConsigneeImportService);

  return forkJoin({ requirements: api.requirements(companyId), session: api.activeSession(companyId) }).pipe(
    map((r) => ({ companyId, ...r })),
    catchError(() => of({
      companyId,
      session: null,
      requirements: {
        ready: false, modules: { aduana: false, contabilidad: false, account_plan: false }, client_account: null,
        blockers: [{ code: 'LOAD_ERROR', message: 'No se pudo cargar el estado de la importación. Intente nuevamente.' }],
      },
    })),
  );
};
