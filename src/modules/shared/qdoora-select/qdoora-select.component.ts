import { Component, computed, ElementRef, HostListener, input, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'qdoora-select',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './qdoora-select.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => QdooraSelectComponent),
      multi: true
    }
  ]
})
export class QdooraSelectComponent implements ControlValueAccessor {
  // Inputs
  label = input<string>('');
  items = input<any[]>([]);
  bindValue = input<string>('id');
  bindLabel = input<string>('name');
  bindSubLabel = input<string>(''); 
  searchable = input<boolean>(false);
  placeholder = input<string>('Seleccione una opción...');
  searchPlaceholder = input<string>('Buscar...');

  // State
  isOpen = signal(false);
  searchTerm = signal('');
  value = signal<any>(null);
  isDisabled = signal(false);

  // Computed
  filteredItems = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const allItems = this.items() || [];
    if (!term) return allItems;
    
    return allItems.filter(item => {
      const labelValue = item[this.bindLabel()] ? String(item[this.bindLabel()]).toLowerCase() : '';
      const subLabelValue = this.bindSubLabel() && item[this.bindSubLabel()] ? String(item[this.bindSubLabel()]).toLowerCase() : '';
      return labelValue.includes(term) || subLabelValue.includes(term);
    });
  });

  selectedItem = computed(() => {
    const allItems = this.items() || [];
    const currentValue = this.value();
    return allItems.find(item => item[this.bindValue()] === currentValue);
  });

  // CVA
  onChange: any = () => {};
  onTouch: any = () => {};

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  writeValue(val: any): void {
    this.value.set(val);
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouch = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    if (!this.isDisabled()) {
      this.isOpen.update(v => !v);
      if (this.isOpen()) {
        this.searchTerm.set('');
        this.onTouch();
      }
    }
  }

  selectItem(item: any, event: Event) {
    event.stopPropagation();
    const val = item[this.bindValue()];
    this.value.set(val);
    this.onChange(val);
    this.isOpen.set(false);
  }

  updateSearch(event: Event) {
    const input = event.target as HTMLInputElement;
    this.searchTerm.set(input.value);
  }
}
