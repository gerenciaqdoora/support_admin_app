import { CommonModule, UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { AbstractControl, FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';

import { CategoriaCuenta, Cuenta, DialogAccountPlan, IfrsAccount, SubCuenta, SubTipo, Tipo } from '@core/models/data/accountPlan';
import { JsonResponse } from '@core/models/response/JsonResponse';
import { PucManagerService } from '@core/services/puc-manager.service';
import { SharedAlertComponent } from '@app/modules/shared/alert/alert.component';
import { SharedConfigCardComponent } from '@app/modules/shared/config-card/config-card.component';
import { SharedInputComponent } from '@app/modules/shared/input/input.component';
import { SelectScrollAndFilterComponent } from '@app/modules/shared/select-with-filter/select-with-filter.component';
import { ToggleButtonComponent } from '@app/modules/shared/toggle-button/toggle-button.component';
import { NotificationService } from '@core/services/notification.service';
import { DialogHeaderComponent } from '../shared/header/header.component';
import { DialogFooterComponent } from '../shared/footer/footer.component';
import { DialogButtonCancelComponent } from '../shared/buttons/cancel-button.component';
import { DialogButtonConfirmComponent } from '../shared/buttons/confirm-button.component';
import { finalize } from 'rxjs';

@Component({
    selector: 'dialog-formulario-cuenta',
    templateUrl: './formulario-cuenta.component.html',
    styles: [
        `
            .dialog-panel {
                @media (min-width: 640px) {
                    width: 32rem; /* equivalent to w-128 */
                }

                @media (min-width: 768px) {
                    width: 50rem; /* equivalent to w-200 */
                }

                .mat-mdc-dialog-container {
                    .mat-mdc-dialog-surface {
                        padding: 0 !important;
                    }
                }
            }
        `,
    ],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        SharedInputComponent,
        FormsModule,
        ReactiveFormsModule,
        SharedAlertComponent,
        ToggleButtonComponent,
        SelectScrollAndFilterComponent,
        UpperCasePipe,
        MatRadioModule,
        SharedConfigCardComponent,
        DialogHeaderComponent,
        DialogFooterComponent,
        DialogButtonCancelComponent,
        DialogButtonConfirmComponent
    ],
})
export class FormularioCuentaDialogComponent
    implements OnInit {

    // Lista de categorias de cuenta
    account_categories: CategoriaCuenta[] = [];
    // Lista de cuentas ifrs
    ifrs_accounts: IfrsAccount[] = [];
    // Datos para aplicar el formulario
    data: DialogAccountPlan = inject(MAT_DIALOG_DATA);
    // Tipo
    tipo!: Tipo;
    // Padre
    subtipo!: SubTipo;
    // Cuenta Actualizado
    cuenta!: Cuenta;
    // Cuenta Actualizado
    allow_master_account_assignation: boolean = true;
    // Formulario ejecutado
    formSubmitted: boolean = false;
    // Formulario
    form!: UntypedFormGroup;
    // Estructura del codigo
    largo_codigo: number = 4;
    // Estructura del codigo cuenta
    largo_nodo: number = 2;
    // Cargador de contenido
    isLoading: boolean = false;
    // Avisos

    // Servicios de Plan de cuenta
    private _accountPlanService = inject(PucManagerService);
    // Método para obtener el control de asignacion_cuenta_contable
    get asignacion_cuenta_contable(): boolean { return this.form.get('asignacion_cuenta_contable')?.value }
    // Método para obtener el control de cuenta contable
    get cuenta_maestra(): any { return this.form.get('cuenta_maestra')?.value }
    // Método para obtener el control de entidad
    get control_trabaja_con_auxiliar_con_rut(): AbstractControl { return this.form.get('trabaja_con_auxiliar_con_rut')! }
    // Método para obtener el control de auxiliar
    get control_trabaja_con_auxiliar(): AbstractControl { return this.form.get('trabaja_con_auxiliar')! }
    // Maneja si cuenta tiene subcuentas asociadas
    get cuenta_tiene_hijos(): boolean { return this.cuenta?.is_expandable || false }
    public alertName: string = 'subTypeForm';
    private _notificationService = inject(NotificationService);
    get resumenOperativa(): string {
        return this._accountPlanService.getResumenOperativa(this.form);
    }
    get resumenTesoreria(): string {
        return this._accountPlanService.getResumenTesoreria(this.form);
    }
    get resumenCuentaMaestra(): string {
        return this._accountPlanService.getResumenCuentaMaestra(this.form);
    }
    get resumenIfrs(): string {
        return this._accountPlanService.getResumenIfrs(this.form);
    }
    get isEditMode(): boolean {
        return !this.data.is_new_record;
    }
    get tieneHijos(): boolean {
        return !this.cuenta_tiene_hijos;
    }
    get showOperativeBody(): boolean {
        if (!this.isEditMode) return true;
        if (!this.cuenta_tiene_hijos) return true;
        return this.form.get('operation_inherited_configuration')?.value;
    }
    get showTreasuryBody(): boolean {
        if (!this.isEditMode) return true;
        if (!this.cuenta_tiene_hijos) return true;
        return this.form.get('treasury_inherited_configuration')?.value;
    }

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _changeDetectorRef: ChangeDetectorRef,
        private dialogRef: MatDialogRef<FormularioCuentaDialogComponent>
    ) { }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this.tipo = this.data.tipo;
        this.subtipo = this.data.subtipo;
        this.largo_codigo = this.data.account_plan!.TIPO_large + this.data.account_plan!.SUB_TIPO_large + this.data.account_plan!.CUENTA_large;
        this.largo_nodo = this.data.account_plan!.CUENTA_large;
        this.account_categories = this.data.account_categories || [];
        this.ifrs_accounts = this.data.ifrs_accounts || [];
        this.initForm();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Inicia el formulario
     *
     */
    initForm() {

        // Create the form
        this.form = this._formBuilder.group({
            id: [null],
            code: ['', [Validators.required, Validators.minLength(this.largo_nodo), Validators.maxLength(this.largo_nodo)]],
            name: ['', [Validators.required, Validators.maxLength(255)]],

            trabaja_con_auxiliar_con_rut: [false], // usara auxiliar con rut
            trabaja_con_auxiliar: [false], // usara auxiliar con rut
            trabaja_con_centro_costo: [false], // usara centro de costo
            trabaja_con_numero_operacion: [false], // usara numero de operacion
            trabaja_con_numero_despacho: [false], // usara numero de despacho
            operation_inherited_configuration: [true], // Hereda operacion

            ifrs_account: [''], // Ifrs

            asignacion_cuenta_contable: [false], // Indica si usara cuenta maestra
            cuenta_maestra: [null], // Cuenta maestra

            show_in_treasury: [false], // Indica si usara tesoreria
            treasury_type: ['receivable_payable'], // Tipo de tesoreria: receivable_payable, bank, cash_box
            treasury_inherited_configuration: [true], // Hereda tesoreria
        });

        if (this.isEditMode && this.data.cuenta) {
            // Deshabilitar el campo code si es necesario
            this.form.get('id')?.setValidators(Validators.required);
            // Deshabilitar el campo code si es necesario
            this.form.get('code')?.disable();
            // Marca todos los controles del formulario como "touched" y "dirty" para que aparezcan los mensajes de error
            this.form.markAllAsTouched();

            // Activamos suscribers
            this.form.get('operation_inherited_configuration')
                ?.valueChanges.subscribe(value => {
                    this.toggleOperativeControls(value);
                });

            this.form.get('treasury_inherited_configuration')
                ?.valueChanges.subscribe(value => {
                    this.toggleTreasuryControls(value);
                });

            // Obtenemos detalles de la cuenta
            this.getDetalleCuenta(this.data.cuenta);
        }

        // Escuchamos cambios de treasury type
        this.form.get('treasury_type')?.valueChanges.subscribe(type => {
            // Si es banco o caja, no puede tener cuenta maestra
            if (type === 'bank' || type === 'cash_box') {
                this.form.get('asignacion_cuenta_contable')?.setValue(false);
                this.form.get('cuenta_maestra')?.setValue(null);
                this.form.get('asignacion_cuenta_contable')?.disable();
                this.form.get('cuenta_maestra')?.disable();
            } else {
                // habilitamos según corresponda
                if (!this.cuenta_tiene_hijos) {
                    this.form.get('asignacion_cuenta_contable')?.enable();
                    this.form.get('cuenta_maestra')?.enable();
                }
            }
            this._changeDetectorRef.markForCheck();
        });
    }

    /**
     * Realiza el request
    */
    onSubmit() {
        if (this.form.invalid) {
            // Marca todos los controles del formulario como "touched" y "dirty" para que aparezcan los mensajes de error
            this.form.markAllAsTouched();

            // Mostrar error
            this.showAlertMessage('warning', 'Faltan datos para continuar');

            // Mark for check
            this._changeDetectorRef.markForCheck();
            return;
        }

        // Objeto de cuenta
        const inputData = this.getFormattedData();

        // Valida que si selecciona uso de cuenta maestra la seleccione
        if (this.form.get('asignacion_cuenta_contable')?.value && !inputData.account_category_id) {
            // Mostrar error
            this.showAlertMessage('warning', `Debe seleccionar una cuenta maestra para continuar.`);

            // Mark for check
            this._changeDetectorRef.markForCheck();
            return;
        }

        // Valida que si selecciona uso de cuenta maestra trabaje con auxiliar con rut
        if (inputData.account_category_id && !inputData.trabaja_con_auxiliar_con_rut) {
            // Mostrar error
            this.showAlertMessage('warning', `Si selecciono una cuenta maestra la cuenta debe trabajar con auxiliar con rut.`);

            // Mark for check
            this._changeDetectorRef.markForCheck();
            return;
        }

        // bnco/caja no permite cuenta maestra
        const treasuryType = this.form.get('treasury_type')?.value;
        const hasMasterAccount = this.form.get('asignacion_cuenta_contable')?.value;
        if (hasMasterAccount && (treasuryType === 'bank' || treasuryType === 'cash_box')) {
            this.showAlertMessage('warning', 'Las cuentas de Banco o Caja no pueden tener una cuenta maestra asignada.');
            return;
        }

        if (!this.isEditMode) { //Creacion

            // Valida que no sean 00 en el codigo
            let codigo_no_permitido = `${this.subtipo.code}${"0".repeat(this.largo_nodo)}`;
            if (inputData.code == codigo_no_permitido) {
                // Mostrar error
                this.showAlertMessage('warning', `Código ${this.subtipo.code}${"0".repeat(this.largo_nodo)} no válido. Pruebe con número que no sea 0.`);

                // Mark for check
                this._changeDetectorRef.markForCheck();
                return;
            }

            // Llamar el servicio
            this.isLoading = true;
            this._accountPlanService.createCuenta(inputData)
                .pipe(finalize(() => {
                    this.isLoading = false;
                    this._changeDetectorRef.markForCheck();
                }))
                .subscribe({
                    next: (response: Cuenta) => {
                        this.cuenta = response;
                        this.showAlertMessage('success', 'Creación exitosa.');
                    },
                    error: (response: JsonResponse<any>) => this.showAlertMessage('error', response.message)
                });
        } else {

            // Llamar el servicio
            this.isLoading = true;
            this._accountPlanService.updateCuenta(this.cuenta!.id as number, inputData)
                .pipe(finalize(() => {
                    this.isLoading = false;
                    this._changeDetectorRef.markForCheck();
                }))
                .subscribe({
                    next: (response: Cuenta) => {
                        this.cuenta = response;
                        this.showAlertMessage('success', 'Edición exitosa.');
                    },
                    error: (response: JsonResponse<any>) => this.showAlertMessage('error', response.message)
                });
        }
    }

    /**
     * Manejamos cambios desde los toggle button
    */
    changeValueToggleButton(toggle: string, value: boolean) {

        console.log('changeValueToggleButton', toggle, value);


        if (toggle == 'entidad' && value) {
            //Si trabaja con aux con rut NO puede trabajar con aux sin rut
            if (this.control_trabaja_con_auxiliar.value) {
                this.control_trabaja_con_auxiliar.setValue(false);
            }
        }
        else if (toggle == 'auxiliar' && value) {
            //Si trabaja con aux sin rut NO puede trabajar con aux con rut
            if (this.control_trabaja_con_auxiliar_con_rut.value) {
                this.control_trabaja_con_auxiliar_con_rut.setValue(false);
            }
        }
        else if (toggle == 'cuenta_maestra') {
            const treasuryType = this.form.get('treasury_type')?.value;

            // Si es banco o caja no permite
            if (value && (treasuryType === 'bank' || treasuryType === 'cash_box')) {
                this.showAlertMessage('warning', 'Las cuentas de Banco o Caja no pueden tener una cuenta maestra asignada.');
                setTimeout(() => {
                    this.form.get('asignacion_cuenta_contable')?.setValue(false);
                    this.form.get('cuenta_maestra')?.setValue(null);
                });
                return;
            }

            // Si tiene asignacion de cuenta maestra, solo trabaja con aux con rut
            if (value) {
                this.control_trabaja_con_auxiliar_con_rut.setValue(true);
                this.control_trabaja_con_auxiliar.setValue(false);
                this.control_trabaja_con_auxiliar.disable();
            }
            else {
                this.control_trabaja_con_auxiliar.enable();
                this.form.get('asignacion_cuenta_contable')?.setValue(false);
                this.form.get('cuenta_maestra')?.setValue(null);
                this.form.get('asignacion_cuenta_contable')?.enable();
                this.form.get('cuenta_maestra')?.enable();
            }
        }
        // Marcamos auxiliar con rut si tiene cuenta maestra seleccionada
        if (this.cuenta_maestra || this.form.get('asignacion_cuenta_contable')?.value) {
            this.control_trabaja_con_auxiliar_con_rut.setValue(true);
            this.control_trabaja_con_auxiliar.setValue(false);
        }
    }

    /**
     * Cambia la cuenta maestra
    */
    onMasterAccountChange(row: CategoriaCuenta): void {
        this.getAsociacionCategoriaCuenta(row!)
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Cierra el modal
     *
    */
    onClose() {
        if (!this.isEditMode && this.cuenta?.id) {
            this.dialogRef.close({ record: this.cuenta });
        }
        else if (this.isEditMode) {
            const formData = this.form.getRawValue();
            // Si fue aplicado el formulario
            // agregamos a la cuenta herencias
            if (this.formSubmitted) {
                this.cuenta.operation_inherited_configuration = formData.operation_inherited_configuration;
                this.cuenta.treasury_inherited_configuration = formData.treasury_inherited_configuration;
            }
            this.dialogRef.close({ record: this.cuenta });
        }
        else {
            this.dialogRef.close(null);
        }
    }

    /**
     * Se genero el cuenta y pasamos a edicion
     */
    private changeStatus() {
        this.data.is_new_record = false;
        this.data.title = 'Editar Cuenta';
        this.form.get('id')?.setValue(this.cuenta.id);
        this.form.get('code')?.setValue(this.cuenta.code);
        this.form.get('code')?.disable();
    }

    /**
     * Mostrar mensaje
     */
    private showAlertMessage(
        type: 'success' | 'error' | 'warning' | 'info',
        message: string,
    ): void {

        if (type === 'success') {
            this._notificationService.success(message);
            this.onClose();
            return;
        }

        this._notificationService.info(message);
    }

    /**
     * Obtiene detalles de la cuenta
     */
    private getDetalleCuenta(cuenta: Cuenta | null): void {
        if (cuenta?.id) {
            setTimeout(() => {
                this.isLoading = true;
                this._accountPlanService.getCuenta(cuenta.id as number)
                    .pipe(finalize(() => {
                        this.isLoading = false;
                        this._changeDetectorRef.markForCheck();
                    }))
                    .subscribe({
                        next: (response: Cuenta) => {
                            console.log('getDetalleCuenta', response);

                            // Procesa la respuesta normalmente
                            this.cuenta = response;
                            this.allow_master_account_assignation = !this.cuenta.is_expandable;

                            // Siempre
                            this.form.get('id')?.setValue(this.cuenta.id);
                            this.form.get('code')?.setValue(this.cuenta.code);
                            this.form.get('name')?.setValue(this.cuenta.name);

                            // IFRS SIEMPRE se respeta
                            if (this.cuenta.ifrs_code) {
                                const ifrs = this.ifrs_accounts.find(r => r.code == this.cuenta?.ifrs_code);
                                this.form.get('ifrs_account')?.setValue(ifrs);
                            }

                            // CASO: TIENE SUBCUENTAS
                            if (this.cuenta_tiene_hijos) {

                                // Operativa se inicia null
                                this.form.patchValue({
                                    trabaja_con_auxiliar_con_rut: null,
                                    trabaja_con_auxiliar: null,
                                    trabaja_con_centro_costo: null,
                                    trabaja_con_numero_operacion: null,
                                    trabaja_con_numero_despacho: null,
                                    operation_inherited_configuration: false
                                });

                                // Tesorería null
                                this.form.patchValue({
                                    show_in_treasury: null,
                                    treasury_type: null,
                                    treasury_inherited_configuration: false
                                });

                                // Cuenta maestra NO se inicializa
                                this.form.patchValue({
                                    asignacion_cuenta_contable: null,
                                    cuenta_maestra: null
                                });

                                this.toggleOperativeControls(false);
                                this.toggleTreasuryControls(false);
                            }

                            // CASO: NO TIENE SUBCUENTAS
                            else {

                                this.form.patchValue({
                                    trabaja_con_auxiliar_con_rut: this.cuenta.trabaja_con_auxiliar_con_rut,
                                    trabaja_con_auxiliar: this.cuenta.trabaja_con_auxiliar || false,
                                    trabaja_con_numero_operacion: this.cuenta.trabaja_con_numero_operacion || false,
                                    trabaja_con_numero_despacho: this.cuenta.trabaja_con_numero_despacho || false,
                                });

                                // Tesoreria
                                if (this.cuenta.show_in_bank) {
                                    this.form.patchValue({
                                        show_in_treasury: true,
                                        treasury_type: 'bank',
                                    });
                                    // Deshabilitar cuenta maestra
                                    this.form.get('asignacion_cuenta_contable')?.disable();
                                    this.form.get('cuenta_maestra')?.disable();
                                } else if (this.cuenta.show_in_treasury) {
                                    this.form.patchValue({
                                        show_in_treasury: true,
                                        treasury_type: 'receivable_payable',
                                    });
                                } else if (this.cuenta.show_in_cash_box) {
                                    this.form.patchValue({
                                        show_in_treasury: true,
                                        treasury_type: 'cash_box',
                                    });
                                    // Deshabilitar cuenta maestra
                                    this.form.get('asignacion_cuenta_contable')?.disable();
                                    this.form.get('cuenta_maestra')?.disable();
                                }

                                // Centro de costo si empresa tiene el flag activo (formulario empresa)
                                if (this.data.company_allow_cost_center) {
                                    this.form.patchValue({
                                        trabaja_con_centro_costo: this.cuenta.trabaja_con_centro_costo
                                    });
                                }

                                // Cuenta maestra
                                if (this.cuenta.categoria?.id && (!this.cuenta.show_in_bank && !this.cuenta.show_in_cash_box)) {
                                    this.form.get('asignacion_cuenta_contable')?.setValue(true);
                                    this.form.get('cuenta_maestra')?.setValue(
                                        this.account_categories.find(r => r.id == this.cuenta?.categoria?.id)
                                    );
                                    // Marcamos auxiliar con rut
                                    this.control_trabaja_con_auxiliar_con_rut.setValue(true);
                                    this.changeValueToggleButton('entidad', true);
                                }

                                this.toggleOperativeControls(true);
                                this.toggleTreasuryControls(true);

                            }

                        },
                        error: (response: JsonResponse<any>) => this.showAlertMessage('error', response.message)
                    });
            });

        }
    }

    /**
     * Obtiene detalles de la cuenta
     */
    private getAsociacionCategoriaCuenta(categoria: CategoriaCuenta): void {
        setTimeout(() => {
            this._accountPlanService.getAsociacionCategoriaCuenta(this.data.account_plan!.id, categoria.id)
                .pipe(finalize(() => this._changeDetectorRef.markForCheck()))
                .subscribe({
                    next: (response: { tipo: string, record: Cuenta | SubCuenta } | null) => {
                        // Procesa la respuesta normalmente
                        if (response?.tipo == 'cuenta') {
                            this.showAlertMessage('warning', `La Cuenta Maestra ${categoria.name} actualmente esta asociada a la cuenta ${response.record.code} | ${response.record.name}`);
                        }
                        else if (response?.tipo == 'subcuenta') {
                            this.showAlertMessage('warning', `La Cuenta Maestra ${categoria.name} actualmente esta asociada a la subcuenta ${response.record.code} | ${response.record.name}`);
                        }
                        else {
                            // Marcamos auxiliar con rut
                            this.control_trabaja_con_auxiliar_con_rut.setValue(true);
                            this.changeValueToggleButton('entidad', true);
                        }
                    },
                    error: (response: JsonResponse<any>) => this.showAlertMessage('error', response.message)
                });
        });
    }

    /**
     * Funcion para formatear el formulario a backend
     */
    private getFormattedData(): Cuenta {
        const formData = this.form.getRawValue();

        const data = new Cuenta({
            id: this.isEditMode
                ? formData.id
                : null,
            code: this.isEditMode
                ? formData.code
                : `${this.subtipo.code}${formData.code}`,
            name: formData.name,
            ifrs_code: formData.ifrs_account?.code || null,
            ifrs_account: formData.ifrs_account || null,
            show_in_products: false,
            show_in_afp: false,
            show_in_treasury: (formData.show_in_treasury && formData.treasury_type == 'receivable_payable')
                ? true
                : false,
            show_in_cash_box: (formData.show_in_treasury && formData.treasury_type == 'cash_box')
                ? true
                : false,
            show_in_bank: (formData.show_in_treasury && formData.treasury_type == 'bank')
                ? true
                : false,
            trabaja_con_auxiliar_con_rut: formData.trabaja_con_auxiliar_con_rut,
            trabaja_con_auxiliar: formData.trabaja_con_auxiliar,
            trabaja_con_centro_costo: this.data.company_allow_cost_center
                ? formData.trabaja_con_centro_costo
                : false,
            trabaja_con_numero_operacion: formData.trabaja_con_numero_operacion,
            trabaja_con_numero_despacho: formData.trabaja_con_numero_despacho,
            account_category_id: (formData.asignacion_cuenta_contable && this.allow_master_account_assignation)
                ? (formData.cuenta_maestra?.id || null)
                : null,
            sub_tipo_id: this.subtipo.id,
            account_plan_id: this.data.account_plan!.id,
            operation_inherited_configuration: (this.isEditMode && this.cuenta_tiene_hijos)
                ? formData.operation_inherited_configuration
                : false,
            treasury_inherited_configuration: (this.isEditMode && this.cuenta_tiene_hijos)
                ? formData.treasury_inherited_configuration
                : false
        });

        return data;
    }

    private toggleOperativeControls(enabled: boolean): void {

        const controls = [
            'trabaja_con_auxiliar_con_rut',
            'trabaja_con_auxiliar',
            'trabaja_con_centro_costo',
            'trabaja_con_numero_operacion',
            'trabaja_con_numero_despacho',
        ];

        controls.forEach(control => {

            const ctrl = this.form.get(control);

            if (!ctrl) return;

            if (enabled) {
                ctrl.enable();
            } else {
                ctrl.reset(null); // 🔹 importante
                ctrl.disable();
            }
        });

        this._changeDetectorRef.markForCheck();
    }

    private toggleTreasuryControls(enabled: boolean): void {

        const showCtrl = this.form.get('show_in_treasury');
        const typeCtrl = this.form.get('treasury_type');

        if (!showCtrl || !typeCtrl) return;

        if (enabled) {
            showCtrl.enable();
            typeCtrl.enable();
        } else {

            showCtrl.reset(null);
            typeCtrl.reset(null);

            showCtrl.disable();
            typeCtrl.disable();
        }

        this._changeDetectorRef.markForCheck();
    }

}
