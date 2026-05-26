export type AlertAppearance = 'border' | 'fill' | 'outline' | 'soft';

export type AlertType =
    | 'primary'
    | 'accent'
    | 'warn'
    | 'basic'
    | 'info'
    | 'success'
    | 'warning'
    | 'error';

export interface AlertMessage {
    appearance: AlertAppearance;
    type: AlertType;
    message: string;
    name: string;
}
