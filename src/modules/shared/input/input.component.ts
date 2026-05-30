import { CommonModule, NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild, ViewEncapsulation, ElementRef } from '@angular/core';
import { AbstractControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { OnlyNumbersDirective } from '@app/core/directives/onlyNumber/only-numbers.directive';
import { RutMaskDirective } from '@app/core/directives/rutMask/rut-mask.directive';
import { ToUppercaseDirective } from '@app/core/directives/uppercase/to-uppercase.directive';
import { qdooraAnimations } from '@core/animations';

@Component({
    selector: 'app-input-form',
    templateUrl: './input.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: qdooraAnimations,
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        FormsModule,
        ReactiveFormsModule,
        RutMaskDirective,
        NgClass,
        OnlyNumbersDirective,
        ToUppercaseDirective
    ]
})
export class SharedInputComponent {
    // Variables que se esperan
    @Input() form!: FormGroup; // El formulario que contiene el control
    @Input() controlName!: string; // Nombre del control en el FormGroup
    @Input() label!: string; // Etiqueta del input
    @Input() icon?: string; // Icono SVG para el input
    @Input() type: string = 'text'; // Tipo de input, por defecto es 'text'
    @Input() useRutMask: boolean = false; // mascara de rut (opcional)
    @Input() useOnlyNumberMask: boolean = false; // mascara de solo numeros (opcional)
    @Input() toUpperCase: boolean = false; // mascara de solo mayusculas (opcional)
    @Input() useIcon: boolean = false; // mascara de rut (opcional)
    @Input() classes: string = ''; // mascara de rut (opcional)
    @Input() typeMatHint: string | null = null; // mascara de rut (opcional)
    @Input() hint: string | null = null; // Texto de ayuda personalizado
    @Input() maxLength: number | null = null; // mascara de rut (opcional)
    @Input() useMatPrefix: boolean = false; // uso de prefijo
    @Input() matPrefixLabel: string | null = null; // prefijo
    @Input() textSize: string = 'text-sm'; // tamaño de letra
    @Input() reduceMarginLabel: boolean = false; // reducir el espacio superior del label
    @Input() compact: boolean = false;
    @Input() placeholder: string | null = null;
    @Input() readonly: boolean = false;
    @Input() required: boolean = false;
    @Input() step: string = 'any'; // Paso para inputs numéricos
    @Input() decimalPlaces: number | null = null; // Cantidad de decimales a forzar al perder el foco
    @Input() autocomplete: string = 'on'; // Control de autocompletado
    @Input() tabIndex: number = 0; // Índice de tabulación

    // Emisiones a componentes "padres"
    @ViewChild('inputValue', { read: ElementRef }) inputElement?: ElementRef;
    @Output() valueChange = new EventEmitter<any>(); // Cambio del valor
    @Output() blur = new EventEmitter<void>(); // Evento al perder el foco


    // Método para obtener el control
    get control(): AbstractControl { return this.form.get(this.controlName)! }

    /**
     * Maneja el evento blur para aplicar formato de decimales si es necesario
     */
    onBlur(): void {
        this.blur.emit();

        if (this.decimalPlaces !== null && this.control?.value !== null && this.control?.value !== undefined) {
            const value = parseFloat(this.control.value);
            if (!isNaN(value)) {
                // Formatear el valor a la cantidad de decimales especificada
                const formattedValue = value.toFixed(this.decimalPlaces);

                // Solo actualizamos si el valor visual es diferente para evitar loops o marcar como dirty innecesariamente
                if (String(this.control.value) !== formattedValue) {
                    this.control.setValue(formattedValue, { emitEvent: false });
                }
            }
        }
    }


    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    // Método que se ejecuta cuando cambia el valor del input
    onInputChange(event: Event): void {
        const inputValue = (event.target as HTMLInputElement).value;
        this.valueChange.emit(inputValue); // Emitimos el valor
    }

    // Metodo que devuelve si el control tiene un error de formulario
    getErrorMessage(): string {
        if (this.control.hasError('required')) {
            return `${this.label} es obligatorio`;
        }
        else if (this.control.hasError('minlength')) {
            return `${this.label} es demasiado corto`;
        }
        else if (this.control.hasError('maxlength')) {
            return `${this.label} es demasiado largo`;
        }
        else if (this.control.hasError('email')) {
            return `${this.label} inválido`;
        }
        else if (this.control.hasError('invalidRut')) {
            return `RUT inválido`;
        }

        return ''; // Retorna vacío si no hay errores
    }

    focus(): void {
        setTimeout(() => {
            if (this.inputElement) {
                this.inputElement.nativeElement.focus();
            }
        }, 100);
    }
}
