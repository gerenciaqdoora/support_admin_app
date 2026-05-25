import { CommonModule, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'app-config-card',
    templateUrl: './config-card.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        NgClass,
        MatTooltipModule
    ],
})
export class SharedConfigCardComponent {

    @Input() title!: string;
    @Input() summary?: string;

    @Input() showInheritToggle = false;
    @Input() inheritValue = false;
    @Input() inheritDisabled = false;

    @Output() inheritChange = new EventEmitter<boolean>();

    isOpen = false;

    toggleOpen() {
        this.isOpen = !this.isOpen;
    }

    onToggleInherit() {
        if (this.inheritDisabled) return;

        // Si se selecciona el toggle button de heredar se abre el body
        if(!this.inheritValue) this.isOpen = true;

        this.inheritChange.emit(!this.inheritValue);
    }

}
