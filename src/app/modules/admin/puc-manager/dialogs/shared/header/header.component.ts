import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-dialog-header',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule],
    template: `
        <div class="flex flex-col items-center p-4 sm:flex-row sm:items-start modal_header w-full relative min-h-[64px]">
            <div class="flex flex-col items-center space-y-1 text-center sm:items-start sm:pr-8 sm:text-left">
                <!-- Title -->
                <div class="text-xl font-medium leading-6 decoration-none" [innerHTML]="title"></div>
                <!-- Subtitle (Optional) -->
                <div *ngIf="subtitle" class="text-white/80 text-md" [innerHTML]="subtitle"></div>
            </div>

            <!-- Dismiss button -->
            <div *ngIf="showCloseButton" class="absolute right-0 top-0 pr-4 pt-2">
                <button mat-icon-button (click)="close.emit()" aria-label="Cerrar diálogo">
                    <mat-icon class="text-white" [svgIcon]="'heroicons_outline:x-mark'"></mat-icon>
                </button>
            </div>
        </div>
    `,
    styles: [`
        .modal_header {
            background-image: url(/images/dialog/back.png) !important;
            background-size: cover!important;
            background-position: left;
            background-repeat: no-repeat;
            border-radius: 1px 2px 0 0;
            overflow: hidden;
            position: relative;
            color: #fff!important;
        }
    `],
    encapsulation: ViewEncapsulation.None
})
export class DialogHeaderComponent {
    @Input() title: string = '';
    @Input() subtitle: string = '';
    @Input() showCloseButton: boolean = true;
    @Output() close = new EventEmitter<void>();
}
