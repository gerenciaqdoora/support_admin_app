import { CommonModule, NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild, ViewEncapsulation, ElementRef } from '@angular/core';
import { AbstractControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
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
    styles: [`
        .custom-margin-top-input .mat-mdc-text-field-wrapper:not(.mdc-text-field--no-label) {
            margin-top: 10px !important;
        }
        .custom-margin-top-input.mat-mdc-form-field.mat-form-field-appearance-fill .mat-mdc-text-field-wrapper .mat-mdc-form-field-flex .mat-mdc-form-field-infix .mat-mdc-floating-label {
            top: -20px !important;
        }
        .custom-margin-top-input.mat-mdc-form-field.mat-form-field-appearance-fill .mat-mdc-form-field-subscript-wrapper{
            font-size: 10px !important;
        }
        .custom-margin-top-input.mat-mdc-form-field-hint-wrapper, .mat-mdc-form-field-error-wrapper{
            top: -4px !important;
        }
        .custom-margin-top-input.mat-mdc-form-field.mat-form-field-appearance-fill .mat-mdc-text-field-wrapper .mat-mdc-form-field-flex {
            height: 40px !important;
            align-items: center !important;
        }

        .compact-shared-input {
            /* Contenedor: Volvemos a la altura de tu diseño original */
            .mat-mdc-text-field-wrapper {
                height: 38px !important;
                min-height: 38px !important;
                background-color: white !important;
                border: 1px solid #dbeafe !important; /* blue-100 */
                border-radius: 8px !important;
                padding: 0 !important;
                display: flex;
                align-items: center;
                transition: border-color 0.2s, box-shadow 0.2s;
            }

            /* El Infix: Sin paddings excesivos para que el texto no "baile" */
            .mat-mdc-form-field-infix {
                padding: 0 !important;
                min-height: 38px !important;
                display: flex !important;
                align-items: center !important;
            }

            /* Prefijo: Alineado perfectamente con el texto */
            [matPrefix] {
                color: #60a5fa !important; /* blue-400 */
                font-weight: 700;
                font-size: 9px;
                margin-right: 6px;
                display: flex;
                align-items: center;
            }

            /* Input: Recuperamos el font-style */
            input.mat-mdc-input-element {
                font-size: 11px !important;
                font-weight: 600 !important;
                color: #334155 !important; /* slate-700 */
                &::placeholder {
                    color: #94a3b8 !important; /* slate-400 */
                    font-weight: 500;
                }
            }

            /* Label: Para que no choque, lo hacemos discreto o lo ocultamos si hay placeholder */
            .mat-mdc-floating-label {
                top: 20px !important; /* Centrado inicial */
            }

            &.mat-form-field-can-float.mat-mdc-form-field-should-float .mat-mdc-floating-label {
                /* Lo movemos lo justo para que se vea como un mini-titulo superior */
                transform: translateY(-24px) scale(0.75) !important;
                color: #3b82f6 !important;
                font-weight: 700;
            }

            /* Quitar decoraciones innecesarias de Material */
            .mdc-line-ripple,
            .mat-mdc-form-field-subscript-wrapper {
                display: none !important;
            }
        }

        /* Efecto Focus para que se sienta nativo */
        .compact-shared-input.mat-form-field-focused .mat-mdc-text-field-wrapper {
            border-color: #60a5fa !important;
            box-shadow: 0 0 0 1px #60a5fa33;
        }

        /* Estados Deshabilitado y Readonly - Sobrescritura final */
        .mat-mdc-form-field.mat-form-field-disabled .mat-mdc-text-field-wrapper,
        .mat-mdc-form-field.is-readonly .mat-mdc-text-field-wrapper {
            background-color: #f1f5f9 !important; /* slate-100 */
            border-color: #e2e8f0 !important; /* slate-200 */
            box-shadow: none !important;
        }

        .mat-mdc-form-field.mat-form-field-disabled input,
        .mat-mdc-form-field.is-readonly input {
            cursor: not-allowed !important;
            color: #64748b !important; /* slate-500 */
            background: transparent !important;
        }
    `],
    imports: [
        CommonModule,
        MatIconModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
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
