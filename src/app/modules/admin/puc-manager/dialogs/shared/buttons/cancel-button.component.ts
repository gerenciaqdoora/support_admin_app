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
            mat-stroked-button
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
