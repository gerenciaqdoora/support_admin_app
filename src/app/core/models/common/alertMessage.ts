export type FuseAlertAppearance = 'border' | 'fill' | 'outline' | 'soft';

export type FuseAlertType =
    | 'primary'
    | 'accent'
    | 'warn'
    | 'basic'
    | 'info'
    | 'success'
    | 'warning'
    | 'error';

export interface AlertMessage {
    appearance: FuseAlertAppearance;
    type: FuseAlertType;
    message: string;
    dismissed: boolean;
    dismissible: boolean;
    name: string;
    timeout: number;
    button_label?: string;
    button_required?: boolean;
    action_clicked?: string;
}
