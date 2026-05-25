import { UpperCasePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { DialogAccountPlan, SubTipo, Tipo } from '@core/models/data/accountPlan';
import { JsonResponse } from '@core/models/response/JsonResponse';
import { PucManagerService } from '@core/services/puc-manager.service';
import { SharedAlertComponent } from '@app/modules/shared/alert/alert.component';
import { SharedInputComponent } from '@app/modules/shared/input/input.component';
import { NotificationService } from '@core/services/notification.service';
import { DialogHeaderComponent } from '../shared/header/header.component';
import { DialogFooterComponent } from '../shared/footer/footer.component';
import { DialogButtonCancelComponent } from '../shared/buttons/cancel-button.component';
import { DialogButtonConfirmComponent } from '../shared/buttons/confirm-button.component';
import { finalize } from 'rxjs';

@Component({
    selector: 'dialog-formulario-subtipo',
    templateUrl: './formulario-subtipo.component.html',
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
    standalone: true,
    imports: [
        MatButtonModule,
        MatDialogModule,
        MatIconModule,
        SharedInputComponent,
        FormsModule,
        ReactiveFormsModule,
        SharedAlertComponent,
        UpperCasePipe,
        DialogHeaderComponent,
        DialogFooterComponent,
        DialogButtonCancelComponent,
        DialogButtonConfirmComponent
    ],
})
export class FormularioSubTipoDialogComponent
    implements OnInit {

    // Datos para aplicar el formulario
    data: DialogAccountPlan = inject(MAT_DIALOG_DATA);
    // Padre
    tipo!: Tipo;
    // SubTipo Actualizado
    subTipo!: SubTipo;
    // Formulario
    form!: UntypedFormGroup;
    // Es creacion/edicion
    is_new_record: boolean = true;
    // Loading state
    isLoading: boolean = false;
    // Estructura del codigo
    largo_codigo: number = 2;
    // Estructura del codigo cuenta
    largo_nodo: number = 1;

    
    private _notificationService = inject(NotificationService);
    private _accountPlanService = inject(PucManagerService);
    private alertName: string = 'subTypeForm';

    /**
     * Constructor
     */
    constructor(
        private _formBuilder: UntypedFormBuilder,
        private _changeDetectorRef: ChangeDetectorRef,
        private dialogRef: MatDialogRef<FormularioSubTipoDialogComponent>
    ) { }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        this.tipo = this.data.tipo;
        this.largo_codigo = this.data.account_plan!.TIPO_large + this.data.account_plan!.SUB_TIPO_large;
        this.largo_nodo = this.data.account_plan!.SUB_TIPO_large;
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
            id: [this.data.is_new_record ? null : this.data.subtipo.id],
            code: [this.data.is_new_record ? '' : this.data.subtipo.code, [Validators.required, Validators.minLength(this.largo_nodo), Validators.maxLength(this.largo_nodo)]],
            name: [this.data.is_new_record ? '' : this.data.subtipo.name, [Validators.required, Validators.maxLength(255)]],
        });

        if (!this.data.is_new_record) {
            // Deshabilitar el campo code si es necesario
            this.form.get('id')?.setValidators(Validators.required);
            // Deshabilitar el campo code si es necesario
            this.form.get('code')?.disable();
            // SubTipo actual
            this.subTipo = this.data.info;
            // Marca todos los controles del formulario como "touched" y "dirty" para que aparezcan los mensajes de error
            this.form.markAllAsTouched();
        }
    }

    /**
     * Realiza el request
     *
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

        if (this.data.is_new_record) {
            // Creacion de subtipo
            const inputData = this.getFormattedData();
            // Valida que no sean 00 en el codigo
            let codigo_no_permitido = `${this.tipo.code}${"0".repeat(this.largo_nodo)}`;
            if (inputData.code == codigo_no_permitido) {
                // Mostrar error
                this.showAlertMessage('warning', `Código ${this.tipo.code}${"0".repeat(this.largo_nodo)} no válido. Pruebe con número que no sea 0.`);

                // Mark for check
                this._changeDetectorRef.markForCheck();
                return;
            }
            // Llamar el servicio
            this.isLoading = true;
            this._accountPlanService.createSubTipo(inputData)
                .pipe(finalize(() => {
                    this.isLoading = false;
                    this._changeDetectorRef.markForCheck();
                }))
                .subscribe({
                    next: (response: SubTipo) => {
                        // Mostrar mensaje
                        this.subTipo = response;
                        this.showAlertMessage('success', 'Creación exitosa.');
                        this.changeStatus();
                    },
                    error: (response: JsonResponse<any>) => this.showAlertMessage('error', response.message)
                });
        } else {
            // Edicion de subtipo
            const inputData = this.getFormattedData();
            // Llamar el servicio
            this.isLoading = true;
            this._accountPlanService.updateSubTipo(this.data.subtipo.id as number, inputData)
                .pipe(finalize(() => {
                    this.isLoading = false;
                    this._changeDetectorRef.markForCheck();
                }))
                .subscribe({
                    next: (response: SubTipo) => {
                        // Mostrar mensaje
                        this.subTipo = response;
                        this.showAlertMessage('success', 'Edición exitosa.');
                    },
                    error: (response: JsonResponse<any>) => this.showAlertMessage('error', response.message)
                });
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Cierra el modal
     *
    */
    onClose() {
        if (this.data.is_new_record && this.subTipo?.id) {
            this.dialogRef.close({ record: this.subTipo });
        }
        else if (!this.data.is_new_record) {
            this.dialogRef.close({ record: this.subTipo });
        }
        else {
            this.dialogRef.close(null);
        }
    }

    /**
     * Se genero el subtipo y pasamos a edicion
     */
    private changeStatus() {
        this.data.is_new_record = false;
        this.data.title = 'Editar Subtipo';
        this.form.get('id')?.setValue(this.subTipo.id);
        this.form.get('code')?.setValue(this.subTipo.code);
        this.form.get('code')?.disable();
    }

    /**
     * Mostrar mensaje
     */
    private showAlertMessage(
        type: 'success' | 'error' | 'warning' | 'info',
        message: string
    ): void {
        if (type === 'success') {
            this._notificationService.success(message);
            this.onClose();
            return;
        }

        this._notificationService.info(message);
    }

    /**
     * Funcion para formatear el formulario a backend
     */
    private getFormattedData(): SubTipo {
        const formData = this.form.getRawValue();
        let data = new SubTipo(
            formData.id,
            formData.code,
            formData.name
        );

        if (this.data.is_new_record) {
            data.code = `${this.tipo.code}${formData.code}`;
            data.tipo_id = this.tipo.id;
            data.account_plan_id = this.data.account_plan!.id;
        }

        return data;
    }

}
