import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { FlatNode, FoodNode } from './matTree';
import { AuthService } from '@core/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import { FlatTreeControl } from "@angular/cdk/tree";
import { MatTableModule } from '@angular/material/table';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PucManagerService } from '@core/services/puc-manager.service';
import { NotificationService } from '@core/services/notification.service';
import { CategoriaCuenta, Cuenta, DialogAccountPlan, IfrsAccount, SubCuenta, SubTipo } from '@core/models/data/accountPlan';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormularioSubTipoDialogComponent } from '../../dialogs/formulario-subtipo/formulario-subtipo.component';
import { MatDialog } from '@angular/material/dialog';
import { JsonResponse } from '@core/models/response/JsonResponse';
import { FormularioCuentaDialogComponent } from '../../dialogs/formulario-cuenta/formulario-cuenta.component';
import { FormularioSubCuentaDialogComponent } from '../../dialogs/formulario-subcuenta/formulario-subcuenta.component';
import { User } from '@core/models/auth.models';
import { ChecklistDatabase } from './checklist-database.service';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
    selector: 'app-account-plan-tree-grid',
    templateUrl: './account-plan-tree-grid.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        CommonModule,
        MatTableModule,
        MatIconModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatExpansionModule,
        FormsModule,
        ReactiveFormsModule,
        MatSelectModule,
        MatTooltipModule
    ],
    styles: [],
    providers: [
        ChecklistDatabase
    ]
})
export class AccountPlanTreeGridComponent
    implements OnInit, OnDestroy {

    user!: User;
    // Lista de categorias de cuenta
    account_categories: CategoriaCuenta[] = [];
    // Lista de cuentas ifrs
    ifrs_accounts: IfrsAccount[] = [];
    // Opciones de cabecera
    header_options_filter_bool: string[] = ['SI', 'NO'];
    // Opciones de cabecera para axiliar
    header_options_filter_auxiliar: string[] = ['CON RUT', 'SIN RUT'];
    // Configuracion de la info para el dialog
    _accountPlanDialog!: DialogAccountPlan;
    // Nodo seleccionado
    selectRowData!: FlatNode;
    // Cadena de strin para manejar busqueda
    regexStr: string = '';
    // Variables para almacenar el valor de búsqueda de código y nombre
    codeFilter: string = '';
    nameFilter: string = '';
    searchCodeControl = new FormControl<string>('', { nonNullable: true });
    searchNameControl = new FormControl<string>('', { nonNullable: true });
    searchCuentaMaestraControl = new FormControl<CategoriaCuenta | null>(null);
    searchCuentaIfrsControl = new FormControl<IfrsAccount | null>(null);
    searchTerceroControl = new FormControl<string | null>(null);
    searchAuxiliarControl = new FormControl<string | null>(null);
    searchCentroCostoControl = new FormControl<string | null>(null);
    // Titulo
    titleHeader: string = 'Plan de Cuenta General';
    // Cargador de contenido
    isLoading: boolean = false;
    // Alerta

    private _notificationService = inject(NotificationService);
    alertName: string = 'accountPlanTable';
    // Despliegue de columnas en tabla
    displayedColumns: string[] = [];
    // Mat tree
    treeControl = new FlatTreeControl<FlatNode>((node: FlatNode) => node.level, (node: FlatNode) => node.expandable);
    nestedNodeMap: Map<FoodNode, FlatNode> = new Map<FoodNode, FlatNode>();
    flatNodeMap: Map<FlatNode, FoodNode> = new Map<FlatNode, FoodNode>();
    private transformer = (node: FoodNode, level: number) => {
        let flatNode = this.nestedNodeMap.has(node) && this.nestedNodeMap.get(node)!.code === node.code ? this.nestedNodeMap.get(node)! : new FlatNode();
        flatNode.id = node.id;
        flatNode.code = node.code;
        flatNode.name = node.name;
        flatNode.ifrs_code = node.ifrs_code;
        flatNode.level = level;
        flatNode.trabaja_con_auxiliar_con_rut = node.trabaja_con_auxiliar_con_rut;
        flatNode.trabaja_con_auxiliar = node.trabaja_con_auxiliar;
        flatNode.trabaja_con_centro_costo = node.trabaja_con_centro_costo;
        flatNode.account_category_id = node.account_category_id;
        flatNode.operation_inherited_configuration = node.operation_inherited_configuration;
        flatNode.level = level;
        flatNode.level = level;
        flatNode.expandable = (node.is_expandable || node.children?.length) ? true : false;
        this.flatNodeMap.set(flatNode, node);
        this.nestedNodeMap.set(node, flatNode);
        return flatNode;
    }
    treeFlattener = new MatTreeFlattener(this.transformer, node => node.level, node => node.expandable, node => node.children);
    dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);
    // Maneja Observables
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    get is_available_crud(): boolean { return this.account_plan_company_id < 0; }
    private account_plan_company_id: number = -1;
    get can_back(): boolean { return this.account_plan_company_id >= 0; }
    hasColumn(column: string): boolean { return this.displayedColumns.includes(column); }


    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Aquí puedes manejar las búsquedas, por ejemplo, suscribiéndote a los cambios
        this.searchCodeControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll), // Espera resolucion de algun observable para continuar
                debounceTime(500) // Tiempo de espera para evitar que la búsqueda se realice en cada tecla
            )
            .subscribe((query: string) => {
                //aplicar busqueda por codigo
                this.codeFilter = query;
                this.applyFilters();
            });

        this.searchNameControl.valueChanges
            .pipe(
                takeUntil(this._unsubscribeAll), // Espera resolucion de algun observable para continuar
                debounceTime(500) // Tiempo de espera para evitar que la búsqueda se realice en cada tecla
            )
            .subscribe((query: string) => {
                //aplicar busqueda por nombre
                this.nameFilter = query;
                this.applyFilters();
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    /**
     * Funcion para ir a la vista de cuentas maestras
    */
    irAMasterAccounts() {
        const companyId = this.account_plan_company_id;
        this.router.navigate([`/accounting/account-plan/master-accounts/${companyId}`]);
    }

    /**
     * Constructor
    */
    constructor(
        private route: ActivatedRoute,
        private _changeDetectorRef: ChangeDetectorRef,
        private matTreeControl: ChecklistDatabase,
        private _pucManagerService: PucManagerService,
        public _authService: AuthService,
        private _matDialog: MatDialog,

        public router: Router
    ) {
        // Obtenemos el parametro de ruta
        this.route.paramMap.subscribe(params => {
            // Si es -1: es plan de cuenta de tu empresa
            // Si es 0: es plan de cuenta puc (previsualizacion)
            // Si es >0: es plan de cuenta de alguna de tus empresas (previsualizacion)
            this.account_plan_company_id = params.get('id') ? parseInt(params.get('id')!) : -1;
        });

        // Accede a los datos resueltos antes de ingresar a la ruta
        this.route.data
            .subscribe((data: any) => {

                console.log('[AccountPlanTreeGridComponent] data', data);

                // Rescatamos datos del plan de cuenta
                this.matTreeControl.accountPlanInfo = data['accountPlanData']['structure'];
                this.matTreeControl.accountPlanData = data['accountPlanData']['tipos'];
                this.matTreeControl.initData = data['accountPlanData']['tipos'];
                // Lista de categorias de cuenta
                this.account_categories = data['accountCategories'];
                // Lista de cuentas ifrs
                this.ifrs_accounts = data['ifrsAccounts'];
                // Titulo de la pagina
                this.titleHeader = `Plan de Cuenta: ${this.matTreeControl.accountPlanInfo.name}`;
                // Publicamos los cambios
                this.matTreeControl.dataChange.next(data['accountPlanData']['tipos']);

            });

        // Obtenemos la data del plan de cuenta
        this.matTreeControl.dataChange
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(data => {
                // Actualizar la info
                this.dataSource.data = data;

                // Expande siempre
                this.treeControl.expandAll();

                // Mark for check
                this._changeDetectorRef.markForCheck();
            });

        // Cambios de empresa
        // Subscribe to the user service
        const user = this._authService.currentUser();
        if (user) {
            this.user = user as User;
            this.displayedColumns = ['code', 'name', 'master', 'ifrs', 'auxiliar'];
            this.displayedColumns.push('centro_costo');
            if (this.is_available_crud) this.displayedColumns.push('actions');
        }

    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Funcion para obtener el nivel
     */
    getLevel = (node: FlatNode) => { return node.level; };
    /**
     * Funcion para saber si puede ser expandido
     */
    isExpandable = (node: FlatNode) => { return node.expandable; };
    /**
     * Funcion para abrir/cerrar nodo
     */
    toggleNode(node: FlatNode): Promise<boolean> {
        //on toggle button -> show/hide
        return new Promise(async resolve => {
            const selectedNode = this.flatNodeMap.get(node);
            if (!selectedNode) return resolve(false);
            //solo traemos la data si aun no se sincroniza el plan de cuenta
            if (!this.treeControl.isExpanded(node) && (!selectedNode.children || !selectedNode.children?.length)) {
                //buscamos todos los padres del nodo
                const ancestors = this.getAncestorsIndex(this.matTreeControl.initData, selectedNode);
                if (node.level == 0) {//es tipo -> buscamos los subtipos
                    const subtipos = await this.getSubtipos(node.id);
                    this.matTreeControl.insertChildren(subtipos, node.level, ancestors || []);
                }
                else if (node.level == 1) {//es subtipo -> buscamos las cuentas
                    const cuentas = await this.getCuentas(node.id);
                    this.matTreeControl.insertChildren(cuentas || [], node.level, ancestors || []);
                }
                else if (node.level == 2) {//es cuenta -> buscamos las subcuentas
                    const subcuentas = await this.getSubCuentas(node.id);
                    this.matTreeControl.insertChildren(subcuentas || [], node.level, ancestors || []);
                }
            }
            this.treeControl.toggle(node);
            resolve(true);
        });
    }
    /**
     * Funcion para saber el nombre segun nivel
     */
    getDataTypeName(node: FlatNode) {
        if (node.level == 0) return 'Tipo';
        else if (node.level == 1) return 'Sub-tipo';
        else if (node.level == 2) return 'Cuenta';
        else if (node.level == 3) return 'Sub-cuenta';
        return '';
    }
    /**
     * Funcion para saber el nombre de cuenta maestra
     */
    getMasterAccount(account_id: number): string {
        const account = this.account_categories.find(r => r.id == account_id);
        if (account) return account.name;
        return '';
    }
    /**
     * Funcion para saber nodo padre de algun nodo
     */
    getParent(node: FlatNode) {
        const { treeControl } = this;
        const currentLevel = treeControl.getLevel(node);
        if (currentLevel < 1) return null;
        const startIndex = treeControl.dataNodes.indexOf(node) - 1;
        for (let i = startIndex; i >= 0; i--) {
            const currentNode = treeControl.dataNodes[i];
            if (treeControl.getLevel(currentNode) < currentLevel) return currentNode;
        }
        return null;
    }
    /**
     * Funcion para saber el arbol genetico de un nodo
     */
    getAncestorsIndex(array: any[], node: any): number[] | null {
        if (typeof array !== 'undefined') {
            for (let i = 0; i < array.length; i++) {
                if (array[i].id == node.id && array[i].code == node.code) return [i];

                const a = this.getAncestorsIndex(array[i].children, node);
                if (a !== null) {
                    a.unshift(i);
                    return a;
                }
            }
        }
        return null;
    }
    /**
     * Funcion para reiniciar filtros
     */
    cleanFilters(apply: boolean = true): void {
        this.searchCodeControl.setValue('');
        this.searchNameControl.setValue('');
        this.searchCuentaMaestraControl.setValue(null);
        this.searchCuentaIfrsControl.setValue(null);
        this.searchTerceroControl.setValue(null);
        this.searchAuxiliarControl.setValue(null);
        this.searchCentroCostoControl.setValue(null);

        if (apply) {
            this.matTreeControl.dataChange.next(this.matTreeControl.initData);
        }
    }
    /**
     * Funcion para sincronizar informacion
     */
    refreshData() {
        this._pucManagerService.getPUC()
            .subscribe(data => {
                this.matTreeControl.accountPlanInfo = data['structure'];
                this.matTreeControl.accountPlanData = data['tipos'];
                this.matTreeControl.initData = data['tipos'];
                // Publicamos los cambios
                this.matTreeControl.dataChange.next(data['tipos']);
            });
    }
    /**
     * Funcion para agregar un nodo
     */
    onActionAddRow(node: FlatNode) {
        // No permitimos el cambio en PUC - solo de empresas
        if (!this.is_available_crud) return;

        const ancestors: number[] = this.getAncestorsIndex(this.matTreeControl.initData, this.flatNodeMap.get(node)) || [];
        //Segun nivel ejecutamos un modal/servicio
        switch (node.level) {
            case 0: //Crear un subtipo
                this._accountPlanDialog = {
                    title: 'Crear subtipo',
                    actions: {
                        confirm: {
                            show: true,
                            label: 'Guardar',
                            color: 'primary',
                        },
                        cancel: {
                            show: true,
                            label: 'Cancelar',
                        },
                    },
                    dismissible: true,
                    is_new_record: true,
                    tipo: node,
                    account_plan: this.matTreeControl.accountPlanInfo
                };

                this._matDialog.open(FormularioSubTipoDialogComponent, {
                    autoFocus: false,
                    disableClose: !this._accountPlanDialog.dismissible,
                    data: this._accountPlanDialog,
                    panelClass: 'dialog-panel',
                }).afterClosed().subscribe((response: { record: SubTipo } | null) => {
                    if (response?.record) {
                        this.matTreeControl.insertItem(response.record, node.level, ancestors);
                        this.treeControl.expand(node);
                    }
                });
                break;
            case 1: //crear cuenta
                this._accountPlanDialog = {
                    title: 'Crear Cuenta',
                    actions: {
                        confirm: {
                            show: true,
                            label: 'Guardar',
                            color: 'primary',
                        },
                        cancel: {
                            show: true,
                            label: 'Cancelar',
                        },
                    },
                    dismissible: true,
                    is_new_record: true,
                    tipo: this.getParent(node),
                    subtipo: node,
                    account_plan: this.matTreeControl.accountPlanInfo,
                    account_categories: this.account_categories,
                    ifrs_accounts: this.ifrs_accounts,
                    company_allow_cost_center: true
                };

                this._matDialog.open(FormularioCuentaDialogComponent, {
                    autoFocus: false,
                    disableClose: !this._accountPlanDialog.dismissible,
                    data: this._accountPlanDialog,
                    panelClass: 'dialog-panel',
                }).afterClosed().subscribe((response: { record: SubTipo } | null) => {
                    if (response?.record) {
                        this.matTreeControl.insertItem(response.record, node.level, ancestors);
                        this.treeControl.expand(node);
                    }
                });
                break;
            case 2: //crear subcuenta
                this._accountPlanDialog = {
                    title: 'Crear Subcuenta',
                    actions: {
                        confirm: {
                            show: true,
                            label: 'Guardar',
                            color: 'primary',
                        },
                        cancel: {
                            show: true,
                            label: 'Cancelar',
                        },
                    },
                    dismissible: true,
                    is_new_record: true,
                    tipo: this.getParent(this.getParent(node) as FlatNode) as FlatNode,
                    subtipo: this.getParent(node) as FlatNode,
                    cuenta: node,
                    account_plan: this.matTreeControl.accountPlanInfo,
                    account_categories: this.account_categories,
                    ifrs_accounts: this.ifrs_accounts,
                    company_allow_cost_center: true
                };

                this._matDialog.open(FormularioSubCuentaDialogComponent, {
                    autoFocus: false,
                    disableClose: !this._accountPlanDialog.dismissible,
                    data: this._accountPlanDialog,
                    panelClass: 'dialog-panel',
                }).afterClosed().subscribe((response: { record: SubTipo } | null) => {
                    if (response?.record) {
                        this.matTreeControl.insertItem(response.record as any, node.level, ancestors);
                        this.treeControl.expand(node);
                    }
                });
                break;
        }
    };
    /**
     * Funcion para editar un nodo
     */
    onActionEditRow(node: FlatNode) {
        // No permitimos el cambio en PUC - solo de empresas
        if (!this.is_available_crud) return;
        const ancestors: number[] = this.getAncestorsIndex(this.matTreeControl.initData, this.flatNodeMap.get(node)) || [];

        //Segun nivel ejecutamos un modal/servicio
        switch (node.level) {
            case 1: //Edicion de subtipo
                this._accountPlanDialog = {
                    title: 'Editar Subtipo',
                    actions: {
                        confirm: {
                            show: true,
                            label: 'Guardar',
                            color: 'primary',
                        },
                        cancel: {
                            show: true,
                            label: 'Cancelar',
                        },
                    },
                    dismissible: true,
                    is_new_record: false,
                    tipo: this.getParent(node),
                    subtipo: node,
                    account_plan: this.matTreeControl.accountPlanInfo
                };

                this._matDialog.open(FormularioSubTipoDialogComponent, {
                    autoFocus: false,
                    disableClose: !this._accountPlanDialog.dismissible,
                    data: this._accountPlanDialog,
                    panelClass: 'dialog-panel',
                }).afterClosed().subscribe((response: { record: SubTipo } | null) => {
                    if (response?.record) {
                        this.matTreeControl.updateItem(response.record, node.level, ancestors);
                        this.treeControl.expand(node);
                    }
                });
                break;
            case 2: //Edicion de cuenta
                this._accountPlanDialog = {
                    title: 'Editar Cuenta',
                    actions: {
                        confirm: {
                            show: true,
                            label: 'Guardar',
                            color: 'primary',
                        },
                        cancel: {
                            show: true,
                            label: 'Cancelar',
                        },
                    },
                    dismissible: true,
                    is_new_record: false,
                    tipo: this.getParent(this.getParent(node) as FlatNode) as FlatNode,
                    subtipo: this.getParent(node) as FlatNode,
                    cuenta: node,
                    account_plan: this.matTreeControl.accountPlanInfo,
                    account_categories: this.account_categories,
                    ifrs_accounts: this.ifrs_accounts,
                    company_allow_cost_center: true
                };

                this._matDialog.open(FormularioCuentaDialogComponent, {
                    autoFocus: false,
                    disableClose: !this._accountPlanDialog.dismissible,
                    data: this._accountPlanDialog,
                    panelClass: 'dialog-panel',
                }).afterClosed().subscribe((response: { record: Cuenta } | null) => {
                    if (response?.record) {
                        this.matTreeControl.updateItem(response.record as any, node.level, ancestors);
                        this.treeControl.expand(node);
                    }
                });
                break;
            case 3: //Edicion de subcuenta
                this._accountPlanDialog = {
                    title: 'Editar Subcuenta',
                    actions: {
                        confirm: {
                            show: true,
                            label: 'Guardar',
                            color: 'primary',
                        },
                        cancel: {
                            show: true,
                            label: 'Cancelar',
                        },
                    },
                    dismissible: true,
                    is_new_record: false,
                    tipo: this.getParent(this.getParent(this.getParent(node) as FlatNode) as FlatNode) as FlatNode,
                    subtipo: this.getParent(this.getParent(node) as FlatNode) as FlatNode,
                    cuenta: this.getParent(node) as FlatNode,
                    subcuenta: node,
                    account_plan: this.matTreeControl.accountPlanInfo,
                    account_categories: this.account_categories,
                    ifrs_accounts: this.ifrs_accounts,
                    company_allow_cost_center: true
                };

                this._matDialog.open(FormularioSubCuentaDialogComponent, {
                    autoFocus: false,
                    disableClose: !this._accountPlanDialog.dismissible,
                    data: this._accountPlanDialog,
                    panelClass: 'dialog-panel',
                }).afterClosed().subscribe((response: { record: SubCuenta } | null) => {
                    if (response?.record) {
                        this.matTreeControl.updateItem(response.record as any, node.level, ancestors);
                        this.treeControl.expand(node);
                    }
                });
                break;
        }
    }
    /**
     * Funcion para eliminar un nodo
    */
    onActionDeleteRow(node: FlatNode) {
        // No permitimos el cambio en PUC - solo de empresas
        if (!this.is_available_crud) return;
        const ancestors = this.getAncestorsIndex(this.matTreeControl.initData, this.flatNodeMap.get(node));

        switch (node.level) {
            case 1: //Eliminacion de subtipo
                // Mostrar dialogo de confirmacion
                if (confirm('¿Estas seguro de eliminar?')) {
                    let result = 'confirmed';
                    if (result == 'confirmed') {
                        // Eliminacion de subtipo
                        this._pucManagerService.deleteSubTipo(node.id)
                            .subscribe({
                                next: (response: SubTipo) => {
                                    // Mostrar mensaje
                                    this.showAlertMessage('success', 'Eliminación exitosa de subtipo.');
                                    this.matTreeControl.deleteItem(node.level, ancestors || []);
                                },
                                error: (response: JsonResponse<any>) => this.showAlertMessage('error', response.message)
                            });
                    }
                }
                break;
            case 2: //Eliminacion de cuenta
                // Mostrar dialogo de confirmacion
                if (confirm('¿Estas seguro de eliminar?')) {
                    let result = 'confirmed';
                    if (result == 'confirmed') {
                        // Eliminacion de subtipo
                        this._pucManagerService.deleteCuenta(node.id)
                            .subscribe({
                                next: (response: Cuenta) => {
                                    // Mostrar mensaje
                                    this.showAlertMessage('success', 'Eliminación exitosa de cuenta.');
                                    this.matTreeControl.deleteItem(node.level, ancestors || []);
                                },
                                error: (response: JsonResponse<any>) => this.showAlertMessage('error', response.message)
                            });
                    }
                }
                break;
            case 3: //Eliminacion de subcuenta
                // Mostrar dialogo de confirmacion
                if (confirm('¿Estas seguro de eliminar?')) {
                    let result = 'confirmed';
                    if (result == 'confirmed') {
                        // Eliminacion de subtipo
                        this._pucManagerService.deleteSubCuenta(node.id)
                            .subscribe({
                                next: (response: SubCuenta) => {
                                    // Mostrar mensaje
                                    this.showAlertMessage('success', 'Eliminación exitosa de subcuenta.');
                                    this.matTreeControl.deleteItem(node.level, ancestors || []);
                                },
                                error: (response: JsonResponse<any>) => this.showAlertMessage('error', response.message)
                            });
                    }
                }
                break;
        }

    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------
    private showAlertMessage(
        type: 'success' | 'error' | 'warning' | 'info',
        message: string
    ): void {
        if (type === 'success') {
            this._notificationService.success(message);
            return;
        }

        this._notificationService.info(message);
    }

    /**
     * Funcion que obtiene los sutipos de un tipo
     */
    private getSubtipos(id: number): Promise<SubTipo[]> {
        return new Promise(resolve => {
            this._pucManagerService.getSubTiposPorTipo(id).subscribe((rows: SubTipo[]) => {
                resolve(rows);
            });
        })
    }

    /**
     * Funcion que obtiene las cuentas de un subtipo
     */
    private getCuentas(id: number): Promise<Cuenta[]> {
        return new Promise(resolve => {
            this._pucManagerService.getCuentasPorSubTipo(id).subscribe((rows: Cuenta[]) => {
                resolve(rows);
            });
        })
    }

    /**
     * Funcion que obtiene las subcuentas de una cuenta
     */
    private getSubCuentas(id: number): Promise<SubCuenta[]> {
        return new Promise(resolve => {
            this._pucManagerService.getSubCuentasPorCuenta(id).subscribe((rows: SubCuenta[]) => {
                resolve(rows);
            });
        })
    }

    /**
     * Funcion para buscar
     */
    applyFilters(event: any = null): void {
        const centroCostoValue = this.searchCentroCostoControl.value;
        const centroCostoFilter = centroCostoValue === 'SI' ? true : (centroCostoValue === 'NO' ? false : null);

        const filteredTree: FoodNode[] = this.filterTreeData(
            this.matTreeControl.initData,
            this.codeFilter || null,
            this.nameFilter || null,
            this.searchCuentaMaestraControl.value?.id || null,
            this.searchCuentaIfrsControl.value?.code || null,
            this.searchAuxiliarControl.value || null,
            centroCostoFilter
        );

        this.matTreeControl.dataChange.next(filteredTree);
    }

    private filterTreeData(
        data: FoodNode[],
        codeFilter: string | null,
        nameFilter: string | null,
        searchCuentaMaestraControl: number | null,
        searchCuentaIfrsControl: string | null,
        searchAuxiliarControl: string | null,
        searchCentroCostoControl: boolean | null
    ): FoodNode[] {

        // Función para aplicar filtros en el nodo actual
        const applyFiltersTreeData = (node: FoodNode, level: number): boolean => {
            const matchesCode = codeFilter ? node.code.includes(codeFilter) : true;
            const matchesName = nameFilter ? node.name.toLowerCase().includes(nameFilter.toLowerCase()) : true;

            const matchesCuentaMaestra = searchCuentaMaestraControl !== null
                ? node.account_category_id === searchCuentaMaestraControl
                : true;

            const matchesIfrs = searchCuentaIfrsControl !== null
                ? node.ifrs_code === searchCuentaIfrsControl
                : true;

            let matchesAuxiliar = true;
            if (searchAuxiliarControl !== null) {
                if (searchAuxiliarControl == 'CON RUT') {
                    matchesAuxiliar = node.trabaja_con_auxiliar_con_rut === true;
                }
                else if (searchAuxiliarControl == 'SIN RUT') {
                    matchesAuxiliar = node.trabaja_con_auxiliar === true;
                }
            }

            const matchesCentroCosto = searchCentroCostoControl !== null
                ? node.trabaja_con_centro_costo === searchCentroCostoControl
                : true;

            return matchesCode && matchesName && matchesCuentaMaestra && matchesIfrs && matchesAuxiliar && matchesCentroCosto;
        };

        // Función recursiva para filtrar los nodos y propagar los resultados hacia arriba
        const filterNode = (node: FoodNode, level: number): FoodNode | null => {
            const nodeMatches = applyFiltersTreeData(node, level);

            if (node.children) {
                const filteredChildren = node.children
                    .map(child => filterNode(child, level + 1))
                    .filter(child => child !== null);

                if (nodeMatches || filteredChildren.length > 0) {
                    return {
                        ...node,
                        children: filteredChildren.length > 0 ? filteredChildren : undefined,
                    };
                }
            } else if (nodeMatches) {
                return { ...node };
            }

            return null;
        };

        // Filtramos todo el árbol de arriba hacia abajo
        return data
            .map(node => filterNode(node, 1))
            .filter(node => node !== null) as FoodNode[];
    }

}
