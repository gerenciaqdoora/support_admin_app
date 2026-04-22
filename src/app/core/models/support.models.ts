export interface User {
    id: number;
    name: string;
    email: string;
    role: 'ADMIN_ROLE' | 'SUPPORT_ROLE' | 'SUBSCRIBER_ROLE' | 'USER_ROLE';
    avatar?: string;
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
    reporter?: User;
    assignee?: User;
    interactions?: TicketInteraction[];
    evidences?: any[];
    delivery_date?: string;
}

export interface TicketInteraction {
    id: number;
    ticket_id: number;
    user_id: number;
    message: string;
    is_internal: boolean;
    created_at: string;
    user?: User;
}

export interface Suscriptor {
    id: number;
    user_id: number;
    es_demo: boolean;
    date_subscribed: string;
    subscription_valid_to: string;
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
