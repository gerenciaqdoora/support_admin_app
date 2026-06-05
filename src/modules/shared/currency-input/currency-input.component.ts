import { Component, ElementRef, input, forwardRef, signal, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'qdoora-currency-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './currency-input.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => QdooraCurrencyInputComponent),
      multi: true
    }
  ]
})
export class QdooraCurrencyInputComponent implements ControlValueAccessor {
  // Inputs configurables
  label = input<string>('');
  currency = input<string>('CLP');
  allowDecimals = input<boolean>(false);
  decimalCount = input<number>(0);
  min = input<number>(0);
  max = input<number | null>(null);
  placeholder = input<string>('0');
  required = input<boolean>(false);

  // Referencia al elemento input nativo
  @ViewChild('inputElement') inputElement!: ElementRef<HTMLInputElement>;

  // Estado interno
  displayValue = signal<string>('');
  isDisabled = signal<boolean>(false);
  isInvalid = signal<boolean>(false);

  // Formatter memoizado según el currency y settings
  formatter = computed(() => {
    return new Intl.NumberFormat('es-CL', {
      style: 'decimal',
      minimumFractionDigits: this.allowDecimals() ? this.decimalCount() : 0,
      maximumFractionDigits: this.allowDecimals() ? this.decimalCount() : 0
    });
  });

  onChange: any = () => {};
  onTouch: any = () => {};

  // Parseo del texto a número puro
  private parseNumber(val: string): number {
    if (!val) return 0;
    // Si no hay decimales, quitar todo excepto números y signo negativo
    if (!this.allowDecimals()) {
      return parseInt(val.replace(/[^\d-]/g, ''), 10) || 0;
    }
    // Si hay decimales, reemplazar comas por puntos y parsear float
    const normalized = val.replace(/\./g, '').replace(',', '.');
    return parseFloat(normalized) || 0;
  }

  // CVA
  writeValue(value: any): void {
    if (value === null || value === undefined || value === '') {
      this.displayValue.set('');
    } else {
      const numValue = Number(value);
      this.displayValue.set(this.formatter().format(numValue));
    }
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouch = fn; }
  setDisabledState(isDisabled: boolean): void { this.isDisabled.set(isDisabled); }

  onInput(event: Event) {
    const inputEvent = event.target as HTMLInputElement;
    const rawVal = inputEvent.value;

    // Solo permitir caracteres válidos según la configuración
    const validRegex = this.allowDecimals() ? /^[0-9.,-]*$/ : /^[0-9.-]*$/;
    if (!validRegex.test(rawVal) && rawVal !== '') {
      inputEvent.value = this.displayValue(); // Revertir si hay caracteres extraños
      return;
    }

    let numericValue = this.parseNumber(rawVal);

    if (!this.allowDecimals()) {
      const formatted = rawVal ? this.formatter().format(numericValue) : '';
      this.displayValue.set(formatted);
      inputEvent.value = formatted;
    } else {
      this.displayValue.set(rawVal); // Mantener temporalmente
    }

    this.onChange(numericValue);
  }

  onBlur(event: Event) {
    this.onTouch();
    let numericValue = this.parseNumber(this.displayValue());
    
    // Aplicar min/max
    if (numericValue < this.min()) numericValue = this.min();
    const maxVal = this.max();
    if (maxVal !== null && numericValue > maxVal) numericValue = maxVal;

    // Actualizar vista final
    const finalFormatted = this.formatter().format(numericValue);
    this.displayValue.set(finalFormatted);
    if (this.inputElement) {
      this.inputElement.nativeElement.value = finalFormatted;
    }
    
    this.onChange(numericValue);
  }
}
