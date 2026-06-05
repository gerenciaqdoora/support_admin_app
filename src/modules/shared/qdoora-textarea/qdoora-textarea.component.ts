import { Component, forwardRef, input, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'qdoora-textarea',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qdoora-textarea.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => QdooraTextareaComponent),
      multi: true
    }
  ]
})
export class QdooraTextareaComponent implements ControlValueAccessor {
  // Inputs configurables
  title = input.required<string>();
  description = input<string | null>(null);
  maxLength = input<number>(255);
  placeholder = input<string>('');
  rows = input<number>(3);
  required = input<boolean>(false);

  @ViewChild('textareaElement') textareaElement!: ElementRef<HTMLTextAreaElement>;

  // Estado interno
  currentValue = signal<string>('');
  isDisabled = signal<boolean>(false);

  onChange: any = () => {};
  onTouch: any = () => {};

  // CVA
  writeValue(value: any): void {
    const stringValue = value === null || value === undefined ? '' : String(value);
    this.currentValue.set(stringValue);
    if (this.textareaElement) {
      this.textareaElement.nativeElement.value = stringValue;
    }
  }

  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouch = fn; }
  setDisabledState(isDisabled: boolean): void { this.isDisabled.set(isDisabled); }

  onInput(event: Event) {
    const inputElement = event.target as HTMLTextAreaElement;
    this.currentValue.set(inputElement.value);
    this.onChange(inputElement.value);
  }

  onBlur() {
    this.onTouch();
  }
}
