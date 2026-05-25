import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormControl, FormControlName, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelect, MatSelectModule } from '@angular/material/select';
import { qdooraAnimations } from '@core/animations';
import { ReplaySubject, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NgxMatSelectSearchModule } from 'ngx-mat-select-search';
import { BlankFormatPipe } from '@app/core/pipes/blank-format.pipe';

@Component({
    selector: 'app-select-with-filter',
    templateUrl: './select-with-filter.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: qdooraAnimations,
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatOptionModule,
        NgxMatSelectSearchModule,
        BlankFormatPipe
    ],
    styles: [`
        .custom-margin-top-select .mat-mdc-text-field-wrapper:not(.mdc-text-field--no-label) {
            margin-top: 10px !important;
        }
        .custom-margin-top-select.mat-mdc-form-field.mat-form-field-appearance-fill .mat-mdc-text-field-wrapper .mat-mdc-form-field-flex .mat-mdc-form-field-infix .mat-mdc-floating-label {
            top: -20px !important;
        }
        .custom-margin-top-select.mat-mdc-form-field.mat-form-field-appearance-fill .mat-mdc-form-field-subscript-wrapper{
            font-size: 10px !important;
        }
        .custom-margin-top-select.mat-mdc-form-field-hint-wrapper, .mat-mdc-form-field-error-wrapper{
            top: -4px !important;
        }
        .custom-margin-top-select.mat-mdc-form-field.mat-form-field-appearance-fill .mat-mdc-text-field-wrapper .mat-mdc-form-field-flex {
            height: 40px !important;
            align-items: center !important;
        }
        /* Eliminar estilos generales intrusivos si los hubiera */



        .compact-search {
            .mat-mdc-text-field-wrapper {
                height: 36px !important;
                min-height: 36px !important;
                padding-top: 0 !important;
                padding-bottom: 0 !important;
            }

            /* Alineación de la etiqueta flotante para que no choque */
            &.mat-form-field-can-float.mat-mdc-form-field-should-float .mat-mdc-floating-label {
                transform: translateY(-18px) scale(0.85) !important;
            }

            .mat-mdc-form-field-flex {
                height: 36px !important;
                align-items: center !important;
            }

            .mat-mdc-form-field-infix {
                padding-top: 4px !important;
                padding-bottom: 4px !important;
                min-height: 36px !important;
                display: flex !important;
                align-items: center !important;
            }

            .mat-mdc-form-field-icon-prefix {
                padding: 0 4px 0 0 !important;
                display: flex;
                align-items: center;
            }

            /* Ocultar subscript y ripple si es compacto */
            .mat-mdc-form-field-subscript-wrapper,
            .mdc-line-ripple {
                display: none !important;
            }

            /* Estado deshabilitado en modo compacto */
            &.mat-form-field-disabled {
                .mat-mdc-text-field-wrapper {
                    background-color: #f1f5f9 !important;
                    border: 1px solid #e2e8f0 !important;
                    box-shadow: none !important;
                    cursor: not-allowed !important;
                }
                .mat-mdc-form-field-flex {
                    background-color: transparent !important;
                    box-shadow: none !important;
                }
                .mat-mdc-select-value-text {
                    color: #64748b !important;
                }
                .mat-mdc-select-arrow {
                    color: #94a3b8 !important;
                }
            }
        }

        /* Resaltado visual para navegación con teclado (MDC) */
        .mat-mdc-option.mat-mdc-option-active,
        .mat-mdc-option.mdc-list-item--focused {
            background-color: rgba(59, 130, 246, 0.12) !important; /* Blue 500 alpha */
            border-left: 4px solid #3b82f6 !important;
        }
        .dark .mat-mdc-option.mat-mdc-option-active,
        .dark .mat-mdc-option.mdc-list-item--focused {
            background-color: rgba(255, 255, 255, 0.15) !important;
            border-left: 4px solid #60a5fa !important;
        }

        .mat-mdc-select-placeholder {
            color: var(--qdoora-text-secondary) !important;
            font-weight: 700 !important;
            font-style: italic !important;
        }
    `]
})
export class SelectScrollAndFilterComponent implements OnInit, OnChanges, OnDestroy {

    @Input() show_atribute_option: string = 'filter_name';// Todas las opciones
    @Input() allOptions: any[] = [];// Todas las opciones
    @Input() matLabel: string | null = null;
    @Input() placeholder: string = '';
    @Input() needEmitChange: Boolean = false;
    @Input() needAddItem: Boolean = false;
    @Input() labelAddItem: string = "Crear item";
    @Input() controlName!: string;
    @Input() required: boolean = false;
    @Output() changeValue = new EventEmitter<any>();
    @Output() addItem = new EventEmitter<any>();
    @Input() parentForm!: FormGroup;
    @Input() textSize: string = 'text-sm';
    @Input() reduceMarginLabel: boolean = false;
    @Input() panelWidth: string = 'auto';
    @Input() icon?: string; // Icono SVG para el input
    @Input() primaryKey: string = 'id'; // Busqueda de pk en lista
    @Input() useIcon: boolean = false; // mascara de rut (opcional)
    @Input() compact: boolean = false; // Nuevo input para el modo comprimido
    /** Si true o 'starts': búsqueda numérica filtra por `code` (startsWith),
     *                      búsqueda alfabética filtra por `name` (startsWith).
     *  Si 'includes': búsqueda numérica filtra por `code` (includes),
     *                  búsqueda alfabética filtra por `name` (includes).
     *  Si false (default): comportamiento original (contains en "code - name")
     */
    @Input() smartFilter: boolean | 'starts' | 'includes' = false;
    @Input() openOnFocus: boolean = false; // Permite abrir el selector automáticamente al recibir foco
    @Input() showNoSelect: boolean = false; // Permite mostrar una opción para limpiar la selección
    @Input() noSelectLabel: string = '--- SIN SELECCIONAR ---'; // Etiqueta para la opción nula
    @Input() tabIndex: number = 0; // Índice de tabulación

    // Resto de las propiedades e inputs
    @ViewChild('select', { static: true }) select!: MatSelect;

    public formControlName?: FormControlName;
    public searchCtrl: FormControl = new FormControl();
    public filteredOptionsSelect: any[] = []; // Opciones mostradas luego del filtro
    public chunkSize = 10; // Cantidad de elementos a cargar por lote
    public lastIndex = 0; // Último índice cargado
    public filteredData: ReplaySubject<any[]> = new ReplaySubject<any[]>(1);

    protected _onDestroy = new Subject<void>();



    /**
     * Compara dos opciones para determinar si son la misma.
     * Soporta que uno sea objeto y el otro un ID simple.
     */
    compareWith = (o1: any, o2: any) => {
        const isEmpty = (val: any) => val === null || val === undefined || String(val).trim() === '';

        if (isEmpty(o1) && isEmpty(o2)) return true;

        if (o1 === null || o2 === null || o1 === undefined || o2 === undefined) {
            return o1 === o2;
        }

        const id1 = typeof o1 === 'object' ? o1[this.primaryKey] : o1;
        const id2 = typeof o2 === 'object' ? o2[this.primaryKey] : o2;

        const normalized1 = (id1 === null || id1 === undefined) ? null : String(id1).trim();
        const normalized2 = (id2 === null || id2 === undefined) ? null : String(id2).trim();

        if (normalized1 === null || normalized2 === null) {
            return normalized1 === normalized2;
        }

        return normalized1 === normalized2;
    }

    constructor() { }

    get ctrl() { return this.parentForm.get(this.controlName) }
    get mostrar_buscador() { return this.filteredOptionsSelect.length > this.chunkSize }

    /**
     * Resuelve la opción seleccionada. 
     * Si el valor ya es un objeto, lo devuelve directamente (permite ediciones manuales).
     * Si es un ID, busca en allOptions para obtener el objeto completo.
     */
    getSelectedOption(): any {
        const value = this.ctrl?.value;
        if (value === null || value === undefined || String(value).trim() === '') return null;

        // Si es un objeto, lo devolvemos directamente para permitir que ediciones manuales se reflejen
        if (typeof value === 'object' && value !== null) {
            return value;
        }

        // Si es un ID simple, buscamos en el catálogo
        const searchValue = String(value).trim();

        if (!this.allOptions || this.allOptions.length === 0) return null;

        return this.allOptions.find(opt => String(opt[this.primaryKey] ?? '').trim() === searchValue);
    }

    ngOnInit(): void {
        // Suscribirse a cambios del buscador
        this.searchCtrl.valueChanges
            .pipe(takeUntil(this._onDestroy))
            .subscribe(() => this.filterOptionByList(this.allOptions, this.searchCtrl.value)
            );

        // Cargar opciones iniciales
        setTimeout(() => { this.loadOptions(true); }, 100);

        // Asegurar que el valor seleccionado está en las opciones visibles
        setTimeout(() => {
            const selected = this.getSelectedOption();
            if (selected && selected[this.primaryKey] != null) {
                const inFiltered = this.filteredOptionsSelect.find(opt => String(opt[this.primaryKey]) === String(selected[this.primaryKey]));
                if (!inFiltered) {
                    this.filteredOptionsSelect.unshift(selected);
                    this.filteredData.next(this.filteredOptionsSelect);
                }
            }
        }, 200);

        // Escuchar cambios externos para mantener la sincronización
        this.ctrl?.valueChanges
            .pipe(takeUntil(this._onDestroy))
            .subscribe(() => {
                const selected = this.getSelectedOption();
                if (selected) {
                    this.ensureOptionVisible(selected);
                }
            });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['allOptions'] && !changes['allOptions'].firstChange) {
            this.allOptions = changes['allOptions'].currentValue;
            this.lastIndex = 0;
            this.filteredOptionsSelect = [];
            this.filteredData.next([]);
            setTimeout(() => { this.loadOptions(true); }, 100);
        }

        // Asegurar que el valor seleccionado está en las opciones visibles.
        setTimeout(() => {
            const selected = this.getSelectedOption();
            if (selected && selected[this.primaryKey] != null) {
                const inFiltered = this.filteredOptionsSelect.find(opt => String(opt[this.primaryKey]) === String(selected[this.primaryKey]));
                if (!inFiltered) {
                    this.filteredOptionsSelect.unshift(selected);
                    this.filteredData.next(this.filteredOptionsSelect);
                }
            }
        }, 200);
    }

    // Funcion llamada desde el padre para mostrar una opcion
    public ensureOptionVisible(option: any): void {
        const idToFind = option && typeof option === 'object' ? option[this.primaryKey] : option;
        if (option && !this.filteredOptionsSelect.find(opt => String(opt[this.primaryKey]) == String(idToFind))) {
            const fullOption = typeof option === 'object' ? option : this.allOptions.find(opt => String(opt[this.primaryKey]) == String(idToFind));
            if (fullOption) {
                this.filteredOptionsSelect.unshift(fullOption);
                this.filteredData.next(this.filteredOptionsSelect);
            }
        }
    }

    removeAccents(str: string): string {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    }

    onSelectPanelClosed() {
        this.searchCtrl.setValue('');
        this.lastIndex = 0;
        const itemsToLoad = this.allOptions.slice(this.lastIndex, this.lastIndex + this.chunkSize);
        this.filteredOptionsSelect = itemsToLoad;
        const selected = this.getSelectedOption();
        if (selected && !this.filteredOptionsSelect.find(e => String(e[this.primaryKey]) === String(selected[this.primaryKey]))) {
            this.filteredOptionsSelect.unshift(selected);
        }

        // Retornar el foco al trigger tras cerrar el panel (especialmente si se usó el buscador)
        setTimeout(() => {
            this.select.focus();
        }, 50);
    }

    onSelectOpened() {
        setTimeout(() => {
            const panel = this.select.panel.nativeElement;
            panel.addEventListener('scroll', () => {
                const scrollTop = panel.scrollTop;
                const scrollHeight = panel.scrollHeight;
                const clientHeight = panel.clientHeight;
                if (scrollHeight - scrollTop === clientHeight) {
                    this.filterOptionByList(this.allOptions, this.searchCtrl.value);
                }
            });
        }, 100)
    }

    onAddItem() {
        if (this.needAddItem) {
            this.addItem.emit(this.searchCtrl.value);
            this.select.close();
        }
    }

    onChangeValue(e: any) {
        this.changeValue.emit(e);
        if (this.select) {
            this.select.close();
            // Mantener el foco en el selector tras la selección para permitir seguir con TAB
            setTimeout(() => {
                this.select.focus();
            }, 50);
        }
    }

    /**
     * Enfoca el selector
     */
    public focus(): void {
        if (this.select) {
            this.select.focus();
        }
    }

    protected filterOptionByList(list: any[], search: string) {
        if (!list) return;

        if (!search) {
            this.loadOptions();
            return;
        }

        const s = search.trim();
        const sLower = this.removeAccents(s.toLowerCase());
        const isNumeric = /^\d/.test(s);

        let itemsToFilter: any[];

        if (this.smartFilter) {
            const mode = (this.smartFilter === 'includes') ? 'includes' : 'startsWith';

            if (isNumeric) {
                // Modo Numérico: Prioridad total al código
                itemsToFilter = list.filter(i => {
                    const code = i.code != null ? this.removeAccents(String(i.code).toLowerCase()) : '';
                    const filter = i.filter_name != null ? this.removeAccents(String(i.filter_name).toLowerCase()) : '';

                    if (mode === 'startsWith') {
                        return code.startsWith(sLower) || filter.startsWith(sLower);
                    } else {
                        return code.includes(sLower) || filter.includes(sLower);
                    }
                });
            } else {
                // Modo Alfabético: Busca en nombre y en el índice completo
                const attr = this.show_atribute_option || 'name';
                itemsToFilter = list.filter(i => {
                    const mainText = i[attr] != null ? this.removeAccents(String(i[attr]).toLowerCase()) : '';
                    const nameText = i.name != null ? this.removeAccents(String(i.name).toLowerCase()) : '';
                    const codeText = i.code != null ? this.removeAccents(String(i.code).toLowerCase()) : '';

                    if (mode === 'startsWith') {
                        // Intentamos buscar por inicio en nombre o en el código (para alfanuméricos)
                        return nameText.startsWith(sLower) || mainText.startsWith(sLower) || codeText.startsWith(sLower);
                    } else {
                        return nameText.includes(sLower) || mainText.includes(sLower) || codeText.includes(sLower);
                    }
                });
            }
        } else {
            // Comportamiento original: contiene en "code - name"
            itemsToFilter = list.filter(i => {
                const searchIdx = this.removeAccents((String(i.code || '') + ' - ' + String(i.name || i.label || '')).toLowerCase());
                return searchIdx.includes(sLower);
            });
        }

        this.lastIndex = 0;
        this.filteredOptionsSelect = [];
        this.filteredOptionsSelect = itemsToFilter.slice(0, this.chunkSize);
        this.filteredData.next(itemsToFilter.slice(0, this.chunkSize));
    }

    loadOptions(initView: boolean = false) {
        const itemsToLoad = this.allOptions?.slice(this.lastIndex, this.lastIndex + this.chunkSize) || [];
        this.filteredOptionsSelect = Array.from(new Set([...this.filteredOptionsSelect, ...itemsToLoad]));
        const selected = this.getSelectedOption();
        if (initView && selected && selected[this.primaryKey] && !this.filteredOptionsSelect.find(e => String(e[this.primaryKey]) == String(selected[this.primaryKey]))) {
            this.filteredOptionsSelect.unshift(selected);
        }
        this.filteredData.next(this.filteredOptionsSelect);
        this.lastIndex += this.chunkSize;
    }

    ngOnDestroy(): void { this._onDestroy.unsubscribe(); }

}
