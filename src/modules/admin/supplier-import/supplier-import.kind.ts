import { ImportKind } from '@core/imports/import-kind';
import { SUPPLIER_ISSUE_LABELS } from '@core/imports/proveedores-v1';
import { SupplierImportItem } from '@core/models/supplier-import.model';
import { SupplierImportService } from '@core/services/supplier-import.service';
import { SupplierImportParserService } from '@core/services/supplier-import-parser.service';
import { SupplierItemDialogData, SupplierItemPanelComponent } from './supplier-item-panel/supplier-item-panel.component';

export const SUPPLIER_KIND: ImportKind = {
  key: 'suppliers',
  title: 'Importar proveedores',
  formatLabel: 'Formato PROVEEDORES_V1',
  uploadTitle: 'Arrastre la planilla de proveedores (.xls o .xlsx)',
  uploadAccept: '.xls,.xlsx',
  templateFileName: 'plantilla-proveedores.xlsx',
  templateLinkText: 'Descargar plantilla',
  alertName: 'supplier-import',
  executeWarning: 'Agrega el rol de proveedor a los auxiliares',
  searchLabel: 'Buscar por código, RUT o nombre',
  masterAccountLabel: 'Cuenta maestra Proveedor Nacional',
  masterName: 'Proveedor Nacional',
  memberLabelPlural: 'proveedores',
  api: SupplierImportService,
  parser: SupplierImportParserService,
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
