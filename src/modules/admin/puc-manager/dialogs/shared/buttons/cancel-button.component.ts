import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-dialog-button-cancel',
    standalone: true,
    imports: [CommonModule, MatButtonModule],
    template: `
        <button
            type="button"
            mat-button
            class="min-w-28 !rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium transition-colors"
            (click)="onCancel()"
            [disabled]="disabled"
        >
            {{ label }}
        </button>
    `,
    encapsulation: ViewEncapsulation.None
})
export class DialogButtonCancelComponent {
    @Input() label: string = 'Cancelar';
    @Input() disabled: boolean = false;
    @Output() readonly cancel = new EventEmitter<void>();

    onCancel(): void {
        this.cancel.emit();
    }
}
