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
    `],
    encapsulation: ViewEncapsulation.None
})
export class DialogFooterComponent { }
