import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '@core/services/notification.service';
import { NotificationAction, NotificationItem, NotificationType } from '@core/models/common/notification';

const STYLES: Record<NotificationType, { box: string; title: string; icon: string; path: string }> = {
  success: { box: 'border-emerald-200', title: 'text-emerald-700', icon: 'bg-emerald-100 text-emerald-600', path: 'M5 13l4 4L19 7' },
  info: { box: 'border-blue-200', title: 'text-blue-700', icon: 'bg-blue-100 text-blue-600', path: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  warning: { box: 'border-amber-200', title: 'text-amber-700', icon: 'bg-amber-100 text-amber-600', path: 'M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z' },
  error: { box: 'border-red-200', title: 'text-red-700', icon: 'bg-red-100 text-red-600', path: 'M6 18L18 6M6 6l12 12' },
};

/** Dibuja las notificaciones de NotificationService (éxito, info, advertencia, error) sobre cualquier pantalla o diálogo. */
@Component({
  selector: 'app-notification-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'pointer-events-none fixed top-4 right-4 z-[10000] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3' },
  template: `
    @for (n of notifications(); track n.id) {
      <div class="pointer-events-auto flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-[0_20px_50px_rgba(15,23,42,0.18)] transition-all duration-300"
        [class]="style(n).box"
        [class.opacity-0]="n.isClosing" [class.translate-x-4]="n.isClosing"
        [attr.role]="n.data.type === 'error' ? 'alert' : 'status'">
        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" [class]="style(n).icon">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="style(n).path" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        <div class="min-w-0 flex-1">
          @if (n.data.title) { <p class="text-[10px] font-black uppercase tracking-widest" [class]="style(n).title">{{ n.data.title }}</p> }
          <p class="mt-0.5 text-xs font-semibold text-slate-700 break-words">{{ n.data.message }}</p>
          @if (n.data.actions?.length) {
            <div class="mt-2 flex gap-3">
              @for (a of n.data.actions; track a.label) {
                <button type="button" (click)="run(n, a)" class="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline cursor-pointer">{{ a.label }}</button>
              }
            </div>
          }
        </div>
        <button type="button" (click)="close(n)" aria-label="Cerrar notificación" class="shrink-0 text-slate-400 hover:text-slate-700 cursor-pointer">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18L18 6M6 6l12 12" stroke-width="2.5" stroke-linecap="round"/></svg>
        </button>
      </div>
    }
  `,
})
export class NotificationHostComponent {
  private _service = inject(NotificationService);
  private _router = inject(Router);
  readonly notifications = this._service.notifications;

  style(n: NotificationItem) { return STYLES[n.data.type]; }
  close(n: NotificationItem): void { this._service.dismiss(n.id); }

  run(n: NotificationItem, a: NotificationAction): void {
    a.action?.();
    if (a.route) void this._router.navigate([a.route], { queryParams: a.queryParams });
    this._service.dismiss(n.id);
  }
}
