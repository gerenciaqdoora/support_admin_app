import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIcon } from '@angular/material/icon';
import { MatSlideToggleChange, MatSlideToggle } from '@angular/material/slide-toggle';
import { qdooraAnimations } from '@core/animations';

@Component({
    selector: 'app-toggle-button',
    templateUrl: './toggle-button.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: qdooraAnimations,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatCheckboxModule,
        MatSlideToggle,
        MatIcon,
    ],
})
export class ToggleButtonComponent {
    // Variables que se esperan
    @Input() form!: FormGroup; // El formulario que contiene el control
    @Input() controlName!: string; // Nombre del control en el FormGroup
    @Input() title!: string; // Titulo del button
    @Input() classes: string = ''; // Clases decorativas (opcional)
    @Input() description: string = ''; // Descripcion del button (opcional)
    @Input() useDescription: boolean = false; // Descripcion (opcional)
    @Input() useIcon: boolean = false; // mascara de rut (opcional)
    @Input() icon?: string; // Icono SVG para el input
    @Input() active_label: string = ''; // Etiqueta para estado activo
    @Input() inactive_label: string = ''; // Etiqueta para estado inactivo

    // Emisiones a componentes "padres"
    @Output() valueChange = new EventEmitter<any>(); // Cambio del valor

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    // Método que se ejecuta cuando cambia el valor del input
    onToggleChange(event: MatSlideToggleChange): void {
        this.valueChange.emit(event.checked);
    }
}
