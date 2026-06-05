import { Component, ElementRef, input, forwardRef, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'qdoora-number-stepper',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule],
  templateUrl: './number-stepper.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => QdooraNumberStepperComponent),
      multi: true
    }
  ]
})
export class QdooraNumberStepperComponent implements ControlValueAccessor {
  // Inputs configurables
  label = input<string>('');
  step = input<number>(1);
  min = input<number>(0);
  max = input<number | null>(null);
  defaultValue = input<number>(1);
  placeholder = input<string>('1');
  required = input<boolean>(false);

  @ViewChild('inputElement') inputElement!: ElementRef<HTMLInputElement>;

  // Estado interno
  currentValue = signal<number | null>(null);
  isDisabled = signal<boolean>(false);

  onChange: any = () => {};
  onTouch: any = () => {};

  // CVA
  writeValue(value: any): void {
    if (value === null || value === undefined || value === '') {
      this.currentValue.set(null);
      if (this.inputElement) this.inputElement.nativeElement.value = '';
    } else {
      const numValue = Number(value);
      this.currentValue.set(numValue);
      if (this.inputElement) this.inputElement.nativeElement.value = numValue.toString();
    }
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouch = fn; }
  setDisabledState(isDisabled: boolean): void { this.isDisabled.set(isDisabled); }

  private updateValue(newVal: number | null) {
    let finalVal = newVal;
    
    if (finalVal !== null) {
      if (finalVal < this.min()) finalVal = this.min();
      const maxVal = this.max();
      if (maxVal !== null && finalVal > maxVal) finalVal = maxVal;
    }

    this.currentValue.set(finalVal);
    if (this.inputElement) {
      this.inputElement.nativeElement.value = finalVal !== null ? finalVal.toString() : '';
    }
    this.onChange(finalVal !== null ? finalVal : null);
  }

  onInput(event: Event) {
    const inputEvent = event.target as HTMLInputElement;
    const rawVal = inputEvent.value;

    // Solo permitir números
    const validRegex = /^[0-9]*$/;
    if (!validRegex.test(rawVal) && rawVal !== '') {
      inputEvent.value = this.currentValue() !== null ? this.currentValue()!.toString() : '';
      return;
    }

    if (rawVal === '') {
      this.currentValue.set(null);
      this.onChange(null);
      return;
    }

    const numericValue = parseInt(rawVal, 10);
    this.currentValue.set(numericValue);
    this.onChange(numericValue);
  }

  onBlur(event: Event) {
    this.onTouch();
    let val = this.currentValue();
    if (val === null) {
      val = this.defaultValue(); // Fallback to defaultValue on blur if empty
    }
    this.updateValue(val);
  }

  decrease() {
    if (this.isDisabled()) return;
    this.onTouch();
    let val = this.currentValue();
    if (val === null) val = this.defaultValue();
    this.updateValue(val - this.step());
  }

  increase() {
    if (this.isDisabled()) return;
    this.onTouch();
    let val = this.currentValue();
    if (val === null) val = this.defaultValue();
    this.updateValue(val + this.step());
  }

  isDecreaseDisabled(): boolean {
    if (this.isDisabled()) return true;
    const val = this.currentValue();
    if (val === null) return false;
    return val <= this.min();
  }

  isIncreaseDisabled(): boolean {
    if (this.isDisabled()) return true;
    const val = this.currentValue();
    if (val === null) return false;
    const maxVal = this.max();
    return maxVal !== null && val >= maxVal;
  }
}
