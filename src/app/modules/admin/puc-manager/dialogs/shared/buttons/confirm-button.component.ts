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
            mat-flat-button
            [color]="color"
            class="min-w-32 relative overflow-hidden"
            [disabled]="disabled || isLoading"
            (click)="onConfirm()"
        >
            <span *ngIf="!isLoading">{{ label }}</span>
            <span *ngIf="isLoading" class="flex items-center justify-center">
                <mat-progress-bar
                    mode="indeterminate"
                    class="absolute bottom-0 inset-x-0"
                ></mat-progress-bar>
                {{ loadingLabel }}
            </span>
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
