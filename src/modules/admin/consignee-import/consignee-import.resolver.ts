import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { catchError, forkJoin, map, of } from 'rxjs';
import { ImportKind } from '@core/imports/import-kind';
import { ImportRequirementsBase } from '@core/services/import-session-api';
import { ConsigneeImportSession } from '@core/models/consignee-import.model';

export interface ConsigneeImportRouteData {
  companyId: number;
  requirements: ImportRequirementsBase;
  session: ConsigneeImportSession | null;
}

/** Resuelve requisitos y sesión activa antes de pintar la pantalla (SUPPORT_RULES, Hard Reject #7). Sirve a toda importación: lee su `kind` de la ruta. */
export const consigneeImportResolver: ResolveFn<ConsigneeImportRouteData> = (route) => {
  const companyId = Number(route.paramMap.get('companyId'));
  const kind = route.data['kind'] as ImportKind;
  const api = inject(kind.api);

  return forkJoin({ requirements: api.requirements(companyId), session: api.activeSession(companyId) }).pipe(
    map((r) => ({ companyId, ...r })),
    catchError(() => of({
      companyId,
      session: null,
      requirements: {
        ready: false,
        blockers: [{ code: 'LOAD_ERROR', message: 'No se pudo cargar el estado de la importación. Intente nuevamente.' }],
      },
    })),
  );
};
