import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewEncapsulation, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { qdooraAnimations } from '@core/animations';
import { Subject, merge } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
        MatIconModule,
    ],
})
export class ToggleButtonComponent implements OnInit, OnDestroy {
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
    // @ Lifecycle & State Methods
    // -----------------------------------------------------------------------------------------------------
    private _onDestroy = new Subject<void>();

    constructor(private _cdr: ChangeDetectorRef) {}

    ngOnInit(): void {
        if (this.form && this.controlName) {
            const ctrl = this.form.get(this.controlName);
            if (ctrl) {
                // Forzamos la detección de cambios cuando el control se altera de forma externa (ej. exclusiones mutuas o disable/enable)
                merge(ctrl.valueChanges, ctrl.statusChanges).pipe(takeUntil(this._onDestroy)).subscribe(() => {
                    this._cdr.detectChanges();
                });
            }
        }
    }

    ngOnDestroy(): void {
        this._onDestroy.next();
        this._onDestroy.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    // Método que se ejecuta cuando cambia el valor del input (toggle)
    onToggleClick(): void {
        if (!this.form || !this.controlName) return;
        const ctrl = this.form.get(this.controlName);
        if (ctrl && !ctrl.disabled) {
            const newValue = !ctrl.value;
            ctrl.setValue(newValue);
            ctrl.markAsDirty();
            this.valueChange.emit(newValue);
        }
    }
}
