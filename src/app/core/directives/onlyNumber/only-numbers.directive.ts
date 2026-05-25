import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appOnlyNumbers]',
  standalone: true
})
export class OnlyNumbersDirective {
    @Input('appOnlyNumbers') enableMask: boolean = true; // Recibe el valor de uso
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
        const cleanValue = value.replace(/[^0-9]/g, '').toUpperCase();

        // Establecer el valor formateado en el campo de entrada
        this.el.nativeElement.value = cleanValue;

        // Llamar a onChange con el valor limpio
        this.onChange(cleanValue);
        this.onTouched();
    }

    @HostListener('blur')
    onBlur() {
        // Llamar a onTouched cuando el campo pierde el foco
        this.onTouched();
    }

    // Métodos requeridos por ControlValueAccessor
    writeValue(value: any): void {
        if (!this.enableMask) {
            // Si la máscara está deshabilitada, escribir el valor sin formato
            this.el.nativeElement.value = value;
            return;
        }
        const cleanValue = value ? value.replace(/\D/g, '') : '';
        this.el.nativeElement.value = cleanValue;
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
