import { Directive, ElementRef, HostListener, Input, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Directive({
    selector: '[appRutMask]',
    standalone: true,
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => RutMaskDirective),
            multi: true,
        },
    ],
})
export class RutMaskDirective implements ControlValueAccessor {
    @Input('appRutMask') enableMask: boolean = true; // Recibe el valor de uso
    private onChange: (value: any) => void = () => {};
    private onTouched: () => void = () => {};

    constructor(private el: ElementRef) {}

    @HostListener('input', ['$event.target.value'])
    onInput(value: string) {
        if (!this.enableMask) {
            // Si la máscara está deshabilitada, pasa el valor sin formato
            this.onChange(value);
            this.onTouched();
            return;
        }
        // Limpiar el valor eliminando caracteres no numéricos, exceptuando la letra K
        const cleanValue = value.replace(/[^0-9kK]/g, '').toUpperCase();

        // Formatear el RUT (ej: 12.345.678-9)
        const formattedRut = this.formatRut(cleanValue);

        // Establecer el valor formateado en el campo de entrada
        this.el.nativeElement.value = formattedRut;

        // Llamar a onChange con el valor limpio
        this.onChange(cleanValue);
        this.onTouched();
    }

    @HostListener('blur')
    onBlur() {
        // Llamar a onTouched cuando el campo pierde el foco
        this.onTouched();
    }

    private formatRut(value: string): string {
        if (!value) return '';
        const rut = value.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        const dv = value.slice(-1);
        return `${rut}-${dv}`;
    }

    // Métodos requeridos por ControlValueAccessor
    writeValue(value: any): void {
        if (!this.enableMask) {
            // Si la máscara está deshabilitada, escribir el valor sin formato
            this.el.nativeElement.value = value;
            return;
        }
        const cleanValue = value ? value.replace(/[^0-9kK]/g, '').toUpperCase() : '';
        this.el.nativeElement.value = this.formatRut(cleanValue);
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    setDisabledState?(isDisabled: boolean): void {
        this.el.nativeElement.disabled = isDisabled;
    }
}
