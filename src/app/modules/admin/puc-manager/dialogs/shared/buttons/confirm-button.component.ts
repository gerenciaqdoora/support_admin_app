import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
    selector: 'app-dialog-button-confirm',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatProgressBarModule],
    template: `
        <button
            type="button"
            class="min-w-32 h-11 px-6 flex items-center justify-center rounded-xl font-medium tracking-wide transition-all"
            [style.color]="(disabled || isLoading) ? '#9ca3af' : '#ffffff'"
            [ngClass]="{
                'bg-blue-600 cursor-pointer hover:bg-blue-700 shadow-sm hover:shadow-md': !disabled && !isLoading && color === 'primary',
                'bg-red-600 cursor-pointer hover:bg-red-700 shadow-sm hover:shadow-md': !disabled && !isLoading && color === 'warn',
                'bg-gray-100 border border-gray-200 cursor-not-allowed shadow-none': disabled || isLoading
            }"
            [disabled]="disabled || isLoading"
            (click)="onConfirm()"
        >
            @if (!isLoading) {
                <span>{{ label }}</span>
            } @else {
                <span class="flex items-center gap-2">
                    <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {{ loadingLabel }}
                </span>
            }
        </button>
    `,
    encapsulation: ViewEncapsulation.None
})
export class DialogButtonConfirmComponent {
    @Input() label: string = 'Confirmar';
    @Input() loadingLabel: string = 'Guardando...';
    @Input() isLoading: boolean = false;
    @Input() disabled: boolean = false;
    @Input() color: string = 'primary';

    @Output() readonly confirm = new EventEmitter<void>();

    onConfirm(): void {
        this.confirm.emit();
    }
}
