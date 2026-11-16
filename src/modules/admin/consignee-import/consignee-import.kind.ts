import { RutFormatPipe } from '@core/pipes/rut-format.pipe';
import { ImportKind } from '@core/imports/import-kind';
import { ISSUE_LABELS } from '@core/imports/sigad-clientes-v1';
import { ConsigneeImportItem } from '@core/models/consignee-import.model';
import { ConsigneeImportService } from '@core/services/consignee-import.service';
import { ConsigneeImportParserService } from '@core/services/consignee-import-parser.service';
import { ImportItemDialogData, ImportItemPanelComponent } from './import-item-panel/import-item-panel.component';

const rutPipe = new RutFormatPipe();

/** RUT con puntos y guion; el pasaporte ('04') se muestra tal cual. */
const formatDocument = (n: ConsigneeImportItem['normalized']): string =>
  n.document_code === '03' ? rutPipe.transform(n.document_number ?? '') : (n.document_number ?? '');

export const CONSIGNEE_KIND: ImportKind = {
  key: 'consignees',
  title: 'Importar consignatarios',
  formatLabel: 'Formato SIGAD_CLIENTES_V1',
  uploadTitle: 'Arrastre el "Listado de clientes" de SIGAD (.xls o .xlsx)',
  uploadAccept: '.xls,.xlsx',
  templateFileName: 'formato-sigad-clientes.xlsx',
  templateLinkText: 'Descargar formato de ejemplo',
  alertName: 'consignee-import',
  executeWarning: 'Crea consignatarios en la empresa',
  searchLabel: 'Buscar por RUT o nombre',
  api: ConsigneeImportService,
  parser: ConsigneeImportParserService,
  issueLabels: { ...ISSUE_LABELS, CODE_IN_USE: 'Código de otro auxiliar' },
  bulkVerifyCode: 'BROKEN_CHARACTERS',
  masterAccountLabel: 'Cuenta maestra Cliente Nacional',
  masterName: 'Cliente Nacional',
  memberLabelPlural: 'clientes',
  masterAccountAssign: true,
  extraMasterAccounts: [{
    categoryCode: 'IVA_DEBITO_FISCAL', path: 'extra-account/vat',
    missingNote: 'No bloquea la importación. La centralización de las ventas exige esta cuenta.',
    hint: 'Solo se ofrecen cuentas de clase Pasivo. Al asignarla queda asociada al impuesto IVA GENERAL (venta), igual que en el catálogo de impuestos.',
  }],
  rcvDefaultsOperation: 'sale',
  columns: [
    { header: 'RUT', widthClass: 'w-36', value: (i) => formatDocument((i as ConsigneeImportItem).normalized) },
    { header: 'Nombre', value: (i) => (i as ConsigneeImportItem).normalized.name },
    { header: 'Comuna', widthClass: 'w-40', value: (i) => i.original['H'] ?? '' },
    { header: 'Rep.', widthClass: 'w-16', value: (i) => String((i as ConsigneeImportItem).normalized.legal_representatives.length) },
  ],
  openItem: ({ dialog, companyId, sessionId, item, onChanged }) => {
    const data: ImportItemDialogData = { companyId, sessionId, item: item as ConsigneeImportItem, onChanged };

    return dialog.open(ImportItemPanelComponent, { panelClass: 'dialog-panel', width: '780px', maxWidth: '95vw', maxHeight: '92vh', data });
  },
};
