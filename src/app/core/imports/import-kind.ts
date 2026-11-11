import { ProviderToken } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ConsigneeImportItem, ParsedSigadFile } from '../models/consignee-import.model';
import { SupplierImportItem } from '../models/supplier-import.model';
import { ImportSessionApi } from '../services/import-session-api';

export type ImportItem = ConsigneeImportItem | SupplierImportItem;

/** Una columna de la tabla de trabajo: encabezado, ancho y valor de la fila. */
export interface ImportColumn {
  header: string;
  widthClass?: string;
  value: (item: ImportItem) => string;
}

/** Lector del archivo de una importación. */
export interface ImportFileParser {
  parse(file: File): Promise<ParsedSigadFile>;
  buildTemplateFile(): Blob;
}

/** Contexto con el que cada importación abre el diálogo propio de su fila. */
export interface ImportItemDialogContext {
  dialog: MatDialog;
  companyId: number;
  sessionId: number;
  item: ImportItem;
  /** API de la importación en curso: el diálogo la usa para guardar, omitir y restaurar. */
  api: ImportSessionApi<any, any>;
  onChanged: () => void;
}

/** Todo lo que cambia entre una importación masiva y otra: textos, API, lector de archivo, columnas y problemas. */
export interface ImportKind {
  key: string;
  title: string;
  formatLabel: string;
  uploadTitle: string;
  uploadAccept: string;
  templateFileName: string;
  templateLinkText: string;
  alertName: string;
  executeWarning: string;
  searchLabel: string;
  api: ProviderToken<ImportSessionApi<any, any>>;
  parser: ProviderToken<ImportFileParser>;
  issueLabels: Record<string, string>;
  columns: ImportColumn[];
  /** Abre el diálogo propio de la fila y devuelve su referencia. */
  openItem: (ctx: ImportItemDialogContext) => MatDialogRef<unknown>;
  /** Filtro rápido de «verificar todo» (solo consignatarios). */
  bulkVerifyCode?: string;
  /** Si existe, la cabecera muestra la cuenta maestra con esta etiqueta y el aviso de diferencia con el archivo (proveedores). */
  masterAccountLabel?: string;
  /** Nombre de la cuenta maestra y plural del rol, para el aviso y el popup de reasignación. */
  masterName?: string;
  memberLabelPlural?: string;
}
