export class Tipo {
    constructor(
        public id: number,
        public code: string,
        public name: string
    ) { }
}

export class SubTipo {
    constructor(
        public id: number,
        public code: string,
        public name: string,
        public tipo_id?: number,
        public account_plan_id?: number,
    ) { }
}

export class Cuenta {
    id: number | null = null;
    code: string;
    name: string;
    ifrs_code?: string | null = null;
    ifrs_account?: IfrsAccount | null = null;
    show_in_products?: boolean = false;
    show_in_afp?: boolean = false;
    show_in_treasury?: boolean = false;
    show_in_cash_box?: boolean = false;
    show_in_bank?: boolean = false;
    trabaja_con_auxiliar_con_rut?: boolean = false;
    trabaja_con_auxiliar?: boolean = false;
    trabaja_con_centro_costo?: boolean = false;
    trabaja_con_numero_operacion?: boolean = false;
    trabaja_con_numero_despacho?: boolean = false;
    account_category_id?: number | null = null;
    sub_tipo_id?: number | null = null;
    account_plan_id?: number | null = null;
    categoria?: CategoriaCuenta | null = null;
    is_expandable?: boolean = false;
    operation_inherited_configuration?: boolean = false;
    treasury_inherited_configuration?: boolean = false;

    constructor(data: Partial<Cuenta> = {}) {
        this.id = data.id || null;
        this.code = data.code || '';
        this.name = data.name || '';
        Object.assign(this, data);
    }
}

export class SubCuenta {
    id: number | null = null;
    code: string;
    name: string;
    ifrs_code?: string | null = null;
    ifrs_account?: IfrsAccount | null = null;
    show_in_products?: boolean = false;
    show_in_afp?: boolean = false;
    show_in_treasury?: boolean = false;
    show_in_cash_box?: boolean = false;
    show_in_bank?: boolean = false;
    trabaja_con_auxiliar_con_rut?: boolean = false;
    trabaja_con_auxiliar?: boolean = false;
    trabaja_con_centro_costo?: boolean = false;
    trabaja_con_numero_operacion?: boolean = false;
    trabaja_con_numero_despacho?: boolean = false;
    account_category_id?: number | null = null;
    account_id?: number | null = null;
    account_plan_id?: number | null = null;
    categoria?: CategoriaCuenta | null = null;

    constructor(data: Partial<SubCuenta> = {}) {
        this.id = data.id || null;
        this.code = data.code || '';
        this.name = data.name || '';
        Object.assign(this, data);
    }
}

export class Structure {
    constructor(
        public id: number,
        public name: string,
        public type: string,
        public company_id: number,
        public TIPO_large: number,
        public SUB_TIPO_large: number,
        public CUENTA_large: number,
        public SUB_CUENTA_large: number
    ) { }
}

export interface DialogAccountPlan {
    title: string;
    actions?: {
        confirm?: {
            show?: boolean;
            label?: string;
            color?: 'primary' | 'accent' | 'warn';
        };
        cancel?: {
            show?: boolean;
            label?: string;
        };
    };
    dismissible?: boolean;
    info?: any; // Replaced FlatNode with any to decouple
    tipo?: any | Tipo;
    subtipo?: any | SubTipo;
    cuenta?: any | Cuenta;
    subcuenta?: any | SubCuenta;
    is_new_record?: boolean;
    account_plan?: Structure;
    account_categories?: CategoriaCuenta[];
    ifrs_accounts?: IfrsAccount[];
    company_allow_cost_center?: boolean;
}

export interface CategoriaCuenta {
    id: number;
    code: string;
    name: string;
    description?: string;
}

export interface IfrsAccount {
    code: string;
    name: string;
}

export interface AccountBadge {
    prefix: string;
    label: string;
    aux_description?: string;
}
