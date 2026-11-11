import { ImportKind } from '@core/imports/import-kind';
import { ISSUE_LABELS } from '@core/imports/sigad-clientes-v1';
import { ConsigneeImportItem } from '@core/models/consignee-import.model';
import { ConsigneeImportService } from '@core/services/consignee-import.service';
import { ConsigneeImportParserService } from '@core/services/consignee-import-parser.service';
import { ImportItemDialogData, ImportItemPanelComponent } from './import-item-panel/import-item-panel.component';

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
  columns: [
    { header: 'Nombre', value: (i) => (i as ConsigneeImportItem).normalized.name },
    { header: 'Comuna', widthClass: 'w-40', value: (i) => i.original['H'] ?? '' },
    { header: 'Rep.', widthClass: 'w-16', value: (i) => String((i as ConsigneeImportItem).normalized.legal_representatives.length) },
  ],
  openItem: ({ dialog, companyId, sessionId, item, onChanged }) => {
    const data: ImportItemDialogData = { companyId, sessionId, item: item as ConsigneeImportItem, onChanged };

    return dialog.open(ImportItemPanelComponent, { panelClass: 'dialog-panel', width: '780px', maxWidth: '95vw', maxHeight: '92vh', data });
  },
};
