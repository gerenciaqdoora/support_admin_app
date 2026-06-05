import { Component, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-dialog-footer',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="flex items-center justify-end space-x-3 px-8 py-5 border-t border-slate-200 bg-slate-50/50 rounded-b-xl w-full">
            <ng-content></ng-content>
        </div>
    `,
    styles: [`
        app-dialog-footer {
            display: block;
            width: 100%;
            margin-top: auto;
        }
        app-dialog-footer button,
        app-dialog-footer .mat-mdc-button,
        app-dialog-footer .mat-mdc-flat-button,
        app-dialog-footer .mat-mdc-unelevated-button,
        app-dialog-footer .mdc-button {
            cursor: pointer !important;
            border-radius: 12px !important;
            font-size: 13px !important;
            font-weight: 600 !important;
            padding: 10px 20px !important;
            transition: all 0.2s ease-in-out !important;
            text-transform: uppercase !important;
            letter-spacing: 0.05em !important;
            height: 42px !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
        }

        /* Botón secundario (cancelar / descarte) */
        app-dialog-footer button:not([color="primary"]):not(.mat-primary):not(.bg-blue-600):not(.bg-red-600):not(.mat-mdc-unelevated-button):not(.mat-mdc-flat-button):not(.bg-amber-600):not(.bg-rose-600) {
            background-color: #ffffff !important;
            color: #64748b !important; /* text-slate-500 */
            border: 1px solid #e2e8f0 !important; /* border-slate-200 */
        }
        app-dialog-footer button:not([color="primary"]):not(.mat-primary):not(.bg-blue-600):not(.bg-red-600):not(.mat-mdc-unelevated-button):not(.mat-mdc-flat-button):not(.bg-amber-600):not(.bg-rose-600):hover {
            background-color: #f8fafc !important; /* bg-slate-50 */
            color: #334155 !important; /* text-slate-700 */
            border-color: #cbd5e1 !important; /* border-slate-300 */
        }

        /* Botón primario (guardar / confirmar) */
        app-dialog-footer button[color="primary"],
        app-dialog-footer button.mat-primary,
        app-dialog-footer button.bg-blue-600,
        app-dialog-footer button.mat-mdc-unelevated-button,
        app-dialog-footer button.mat-mdc-flat-button {
            background-color: #2563eb !important; /* bg-blue-600 */
            color: #ffffff !important;
            border: none !important;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
        }
        app-dialog-footer button[color="primary"]:hover,
        app-dialog-footer button.mat-primary:hover,
        app-dialog-footer button.bg-blue-600:hover,
        app-dialog-footer button.mat-mdc-unelevated-button:hover,
        app-dialog-footer button.mat-mdc-flat-button:hover {
            background-color: #1d4ed8 !important; /* bg-blue-700 */
            transform: translateY(-1px);
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1) !important;
        }

        app-dialog-footer button[disabled] {
            opacity: 0.5 !important;
            cursor: not-allowed !important;
            transform: none !important;
            box-shadow: none !important;
            background-color: #e2e8f0 !important;
            color: #94a3b8 !important;
            border-color: #e2e8f0 !important;
        }
    `],
    encapsulation: ViewEncapsulation.None
})
export class DialogFooterComponent { }
