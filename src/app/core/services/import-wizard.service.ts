import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { ImportWizardOverview } from '../models/import-wizard.model';

interface ApiEnvelope<T> { data: T; message: string; }

/** Asistente de importaciones de Aduana (v1/support/companies/{id}/aduana/imports). */
@Injectable({ providedIn: 'root' })
export class ImportWizardService {
  private _http = inject(HttpClient);

  private prefix(companyId: number): string {
    return `/api/v1/support/companies/${companyId}/aduana/imports`;
  }

  private data(obs: Observable<ApiEnvelope<ImportWizardOverview>>): Observable<ImportWizardOverview> {
    return obs.pipe(map((r) => r.data));
  }

  overview(companyId: number) {
    return this.data(this._http.get<ApiEnvelope<ImportWizardOverview>>(this.prefix(companyId)));
  }

  markNotApplicable(companyId: number, stepCode: string) {
    return this.data(this._http.put<ApiEnvelope<ImportWizardOverview>>(`${this.prefix(companyId)}/steps/${stepCode}/not-applicable`, {}));
  }

  unmarkNotApplicable(companyId: number, stepCode: string) {
    return this.data(this._http.delete<ApiEnvelope<ImportWizardOverview>>(`${this.prefix(companyId)}/steps/${stepCode}/not-applicable`));
  }
}
