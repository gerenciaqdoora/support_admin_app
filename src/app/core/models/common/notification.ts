export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export interface NotificationAction {
    label: string;
    action?: () => void;
    route?: string;
    queryParams?: any;
    color?: 'primary' | 'accent' | 'warn' | 'white';
}

export interface NotificationData {
    title?: string;
    message: string;
    type: NotificationType;
    actions?: NotificationAction[];
}

export interface NotificationItem {
    id: string;
    data: NotificationData;
    duration: number;
    isClosing?: boolean;
}

