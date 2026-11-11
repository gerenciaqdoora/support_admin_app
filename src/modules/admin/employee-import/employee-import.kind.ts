import { ImportKind } from '@core/imports/import-kind';
import { SUPPLIER_ISSUE_LABELS } from '@core/imports/proveedores-v1';
import { SupplierImportItem } from '@core/models/supplier-import.model';
import { EmployeeImportService } from '@core/services/employee-import.service';
import { EmployeeImportParserService } from '@core/services/employee-import-parser.service';
import { SupplierItemDialogData, SupplierItemPanelComponent } from '../supplier-import/supplier-item-panel/supplier-item-panel.component';

export const EMPLOYEE_KIND: ImportKind = {
  key: 'employees',
  title: 'Importar empleados',
  formatLabel: 'Formato EMPLEADOS_V1',
  uploadTitle: 'Arrastre la planilla de empleados (.xls o .xlsx)',
  uploadAccept: '.xls,.xlsx',
  templateFileName: 'plantilla-empleados.xlsx',
  templateLinkText: 'Descargar plantilla',
  alertName: 'employee-import',
  executeWarning: 'Agrega el rol de empleado y crea su perfil de Nómina',
  searchLabel: 'Buscar por código, RUT o nombre',
  masterAccountLabel: 'Cuenta maestra Remuneraciones por Pagar',
  masterName: 'Remuneraciones por Pagar',
  memberLabelPlural: 'empleados',
  api: EmployeeImportService,
  parser: EmployeeImportParserService,
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
