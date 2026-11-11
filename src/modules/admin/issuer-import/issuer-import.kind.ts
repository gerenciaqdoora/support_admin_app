import { ImportKind } from '@core/imports/import-kind';
import { SUPPLIER_ISSUE_LABELS } from '@core/imports/proveedores-v1';
import { SupplierImportItem } from '@core/models/supplier-import.model';
import { IssuerImportService } from '@core/services/issuer-import.service';
import { IssuerImportParserService } from '@core/services/issuer-import-parser.service';
import { SupplierItemDialogData, SupplierItemPanelComponent } from '../supplier-import/supplier-item-panel/supplier-item-panel.component';

export const ISSUER_KIND: ImportKind = {
  key: 'issuers',
  title: 'Importar emisores',
  formatLabel: 'Formato EMISORES_V1',
  uploadTitle: 'Arrastre la planilla de emisores (.xls o .xlsx)',
  uploadAccept: '.xls,.xlsx',
  templateFileName: 'plantilla-emisores.xlsx',
  templateLinkText: 'Descargar plantilla',
  alertName: 'issuer-import',
  executeWarning: 'Agrega el rol de emisor de honorarios',
  searchLabel: 'Buscar por código, RUT o nombre',
  masterAccountLabel: 'Cuenta maestra Honorarios por Pagar',
  masterName: 'Honorarios por Pagar',
  memberLabelPlural: 'emisores',
  api: IssuerImportService,
  parser: IssuerImportParserService,
  issueLabels: SUPPLIER_ISSUE_LABELS,
  bulkVerifyCode: 'BROKEN_CHARACTERS',
  columns: [
    { header: 'Código', widthClass: 'w-28', value: (i) => (i as SupplierImportItem).normalized.code ?? '' },
    { header: 'RUT', widthClass: 'w-36', value: (i) => (i as SupplierImportItem).normalized.rut ?? '' },
    { header: 'Nombre', value: (i) => (i as SupplierImportItem).normalized.name ?? '' },
  ],
  openItem: ({ dialog, companyId, sessionId, item, api, onChanged }) => {
    const data: SupplierItemDialogData = { companyId, sessionId, item: item as SupplierImportItem, api, onChanged };

    return dialog.open(SupplierItemPanelComponent, { panelClass: 'dialog-panel', width: '720px', maxWidth: '95vw', maxHeight: '92vh', data });
  },
};
