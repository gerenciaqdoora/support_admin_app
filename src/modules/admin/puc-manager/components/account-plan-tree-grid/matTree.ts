

export class FoodNode {
    id!: number;
    code!: string;
    name!: string;
    ifrs_code?: string;
    account_category_id?: number;
    trabaja_con_auxiliar_con_rut?: boolean;
    trabaja_con_auxiliar_sin_rut?: boolean;
    trabaja_con_centro_costo?: boolean;
    children?: FoodNode[];
    is_expandable?: boolean;
    operation_inherited_configuration?: boolean = false;

    /**
     * Si deseo mostrar conf de tresury en tree grid agregar
     *
     * treasury_inherited_configuration
     * show_in_treasury
     * show_in_cash_box
     * show_in_bank
    */
}

export class FlatNode {
    id!: number;
    code!: string;
    name!: string;
    ifrs_code?: string;
    account_category_id?: number;
    trabaja_con_auxiliar_con_rut?: boolean;
    trabaja_con_auxiliar_sin_rut?: boolean;
    trabaja_con_centro_costo?: boolean;
    expandable!: boolean;
    operation_inherited_configuration?: boolean = false;
    /**
     * Si deseo mostrar conf de tresury en tree grid agregar
     *
     * treasury_inherited_configuration
     * show_in_treasury
     * show_in_cash_box
     * show_in_bank
    */
    level!: number;
}
