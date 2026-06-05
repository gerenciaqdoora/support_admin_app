import { Component, forwardRef, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'qdoora-checkbox',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './qdoora-checkbox.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => QdooraCheckboxComponent),
      multi: true
    }
  ]
})
export class QdooraCheckboxComponent implements ControlValueAccessor {
  // Inputs configurables
  title = input.required<string>();
  description = input<string | null>(null);

  // Estado interno
  checked = signal<boolean>(false);
  isDisabled = signal<boolean>(false);

  onChange: any = () => {};
  onTouch: any = () => {};

  // CVA
  writeValue(value: any): void {
    this.checked.set(!!value);
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouch = fn; }
  setDisabledState(isDisabled: boolean): void { this.isDisabled.set(isDisabled); }

  toggle(event: Event) {
    if (this.isDisabled()) return;
    
    const inputElement = event.target as HTMLInputElement;
    const isChecked = inputElement.checked;
    
    this.checked.set(isChecked);
    this.onChange(isChecked);
    this.onTouch();
  }
}
