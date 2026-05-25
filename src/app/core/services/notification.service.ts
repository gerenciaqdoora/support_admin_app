import { Injectable, signal } from '@angular/core';
import { NotificationAction, NotificationData, NotificationType, NotificationItem } from '@core/models/common/notification';

@Injectable({
    providedIn: 'root'
})
export class NotificationService {
    // Array of active notifications using Angular Signals
    private _notifications = signal<NotificationItem[]>([]);
    public readonly notifications = this._notifications.asReadonly();

    /**
     * Generate a unique ID for each notification
     */
    private _generateId(): string {
        return Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    }

    /**
     * Show a custom notification stacked with others
     */
    show(
        message: string,
        type: NotificationType = 'info',
        actions: NotificationAction[] = [],
        title?: string,
        duration: number = 5000
    ): string {
        const id = this._generateId();
        const data: NotificationData = {
            title,
            message,
            type,
            actions
        };

        const newItem: NotificationItem = {
            id,
            data,
            duration,
            isClosing: false
        };

        // Add to active notifications signal
        this._notifications.update((prev) => [...prev, newItem]);

        // Auto-dismiss after the duration
        if (duration > 0) {
            setTimeout(() => {
                this.dismiss(id);
            }, duration);
        }

        return id;
    }

    /**
     * Start the dismiss transition, then remove the notification
     */
    dismiss(id: string): void {
        // Find if it exists and mark it as closing for smooth fade/slide out animation
        const current = this._notifications();
        const exists = current.some((item) => item.id === id);
        if (!exists) return;

        this._notifications.update((prev) =>
            prev.map((item) => (item.id === id ? { ...item, isClosing: true } : item))
        );

        // Wait for exit transition (300ms matches Tailwind transition duration)
        setTimeout(() => {
            this._notifications.update((prev) => prev.filter((item) => item.id !== id));
        }, 300);
    }

    /**
     * Show success notification
     */
    success(message: string, actions: NotificationAction[] = [], title?: string): void {
        this.show(message, 'success', actions, title || 'Éxito');
    }

    /**
     * Show info notification
     */
    info(message: string, actions: NotificationAction[] = [], title?: string): void {
        this.show(message, 'info', actions, title || 'Información');
    }

    /**
     * Show warning notification
     */
    warning(message: string, actions: NotificationAction[] = [], title?: string): void {
        this.show(message, 'warning', actions, title || 'Advertencia');
    }

    /**
     * Show error notification
     */
    error(message: string, actions: NotificationAction[] = [], title?: string): void {
        // Errors usually stay longer (8000ms)
        this.show(message, 'error', actions, title || 'Error', 8000);
    }

    // Alias for compatibility
    showSuccess(message: string, actions: NotificationAction[] = [], title?: string): void {
        this.success(message, actions, title);
    }
}
