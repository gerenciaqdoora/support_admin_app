export interface User {
    id: number;
    name: string;
    email: string;
    role: 'ADMIN_ROLE' | 'SUPPORT_ROLE' | 'SUBSCRIBER_ROLE' | 'USER_ROLE';
    avatar?: string;
    deleted_at?: string;
}

export enum TicketStatus {
    OPEN = 'OPEN',
    IN_PROGRESS = 'IN_PROGRESS',
    PENDING_USER = 'PENDING_USER',
    RESOLVED = 'RESOLVED',
    CLOSED = 'CLOSED'
}

export enum TicketPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    URGENT = 'URGENT'
}

export enum LoggerEvent {
    USUARIO = 'USUARIO',
    SUSCRIPTOR = 'SUSCRIPTOR',
    DOCUMENTOS = 'DOCUMENTOS',
    COMPROBANTE = 'COMPROBANTE',
    VENTA = 'VENTA',
    COMPRA = 'COMPRA',
    REPORTE = 'REPORTE',
    AUXILIAR = 'AUXILIAR',
    PRODUCTO = 'PRODUCTO',
    TESORERIA = 'TESORERIA',
    PARAMETROS = 'PARAMETROS',
    IMPORTACION = 'IMPORTACION',
    EMPRESA = 'EMPRESA',
    TIPO = 'TIPO',
    SUBTIPO = 'SUBTIPO',
    CUENTA = 'CUENTA',
    SUBCUENTA = 'SUBCUENTA',
    CUENTA_MAESTRA = 'CUENTA MAESTRA',
    PLAN_DE_CUENTA = 'PLAN DE CUENTA',
    BOLETA_HONORARIO = 'BOLETA HONORARIO',
    CENTRO_COSTO = 'CENTRO COSTO',
    HABER_DESCUENTO = 'HABER Y/O DESCUENTO',
    NOMINA_CONFIGURACION = 'CONFIGURACION NOMINA',
    ROL_USUARIO = 'ROL DE USUARIO',
    EMPLEADO = 'EMPLEADO',
    SUCURSAL = 'SUCURSAL',
    ADUANA_DIN = 'ADUANA DIN',
    ADUANA_CONTEXT = 'ADUANA CONTEXT',
    ADUANA_MAESTRO = 'ADUANA MAESTRO',
    LIQUIDACION = 'LIQUIDACION',
    SISTEMA = 'SISTEMA'
}

export interface Ticket {
    id: number;
    code: string;
    subject: string;
    description: string;
    status: TicketStatus;
    priority: TicketPriority;
    type: string;
    reporter_id: number;
    assignee_id?: number;
    suscriptor_id: number;
    company_id?: number;
    created_at: string;
    updated_at: string;
    resolved_at?: string;
    closed_at?: string;
    reopened_at?: string;
    sla_limit_at?: string;
    solution?: string;
    reopening_count: number;
    metadata?: {
        event_id?: string;
        stack_trace?: string;
        erp_user_id?: number;
    };
    related_documents?: {
        type: string;
        id: number;
        code: string;
    }[];
    reporter?: User;
    assignee?: User;
    interactions?: TicketInteraction[];
    traceability?: ForensicLog[];
    evidences?: any[];
    tags?: {
        id: number;
        name: string;
    }[];
    delivery_date?: string;
    official_solution?: string;
    chat_status?: 'NONE' | 'REQUESTED' | 'ACTIVE' | 'CLOSED';
}

export interface ForensicLog {
    id: number;
    ticket_id: number;
    user_id: number;
    action: string;
    old_value?: any;
    new_value?: any;
    description?: string;
    ip_address?: string;
    user_agent?: string;
    created_at: string;
    user?: User;
}

export interface TicketInteraction {
    id: number;
    ticket_id: number;
    user_id: number;
    message: string;
    is_internal: boolean;
    set_status?: string;
    created_at: string;
    user?: User;
}

export interface Suscriptor {
    id: number;
    user_id: number;
    es_demo: boolean;
    date_subscribed: string;
    subscription_valid_to: string;
    deleted_at?: string;
    usuario?: User;
    empresas?: any[];
    teamUsers?: any[];
    latest_suscriptor_plan?: any;
    empresas_count?: number;
    team_users_count?: number;
}

export interface HelpCategory {
    id: number;
    name: string;
    slug: string;
    icon?: string;
    description?: string;
    articles_count?: number;
    articles?: HelpArticle[];
}

export interface HelpArticle {
    id: number;
    category_id: number;
    title: string;
    slug: string;
    content: string;
    is_published: boolean;
    view_count: number;
    category?: HelpCategory;
    created_at?: string;
}
