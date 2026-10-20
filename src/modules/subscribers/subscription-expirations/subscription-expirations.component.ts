import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '@core/services/auth.service';
import { ExpirationGroup, ExpirationRow, SubscriberService } from '@core/services/subscriber.service';
import { ExtendPlanDialogComponent } from '../subscriber-detail/extend-plan-dialog/extend-plan-dialog.component';
import { EXPIRY_TONE_CLASS, expiryBadge } from '../plan-expiry';

/** Planes por vencer, en gracia y suspendidos, con la acción de extender el plazo. */
@Component({
  selector: 'app-subscription-expirations',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink],
  template: `
    <div class="h-full overflow-auto bg-slate-50/50 p-8">
      <div class="max-w-[1200px] mx-auto flex flex-col gap-6">
        <header class="flex flex-col gap-1">
          <h1 class="text-2xl font-black text-slate-800">Vencimientos</h1>
          <p class="text-sm text-slate-500">Planes que requieren atención antes o después de que el proceso diario los suspenda.</p>
        </header>

        <div role="tablist" aria-label="Grupos de vencimiento" class="flex gap-2">
          @for (tab of tabs; track tab.group) {
            <button type="button" role="tab" [attr.aria-selected]="group() === tab.group" (click)="selectGroup(tab.group)"
              class="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border cursor-pointer"
              [class]="group() === tab.group ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'">
              {{ tab.label }}
            </button>
          }
        </div>

        <section class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
          @if (resource.isLoading()) {
            <p class="p-6 text-sm text-slate-500">Cargando vencimientos…</p>
          } @else if (resource.error()) {
            <p class="p-6 text-sm text-red-600">
              No se pudieron cargar los vencimientos.
              <button type="button" class="underline cursor-pointer" (click)="resource.reload()">Reintentar</button>
            </p>
          } @else if (rows().length === 0) {
            <p class="p-6 text-sm text-slate-500">{{ emptyMessage() }}</p>
          } @else {
            <table class="w-full text-sm">
              <thead class="text-left text-[10px] uppercase tracking-widest text-slate-500">
                <tr>
                  <th class="p-4">Suscriptor</th><th class="p-4">Plan</th><th class="p-4">Vence</th><th class="p-4">Estado</th>
                  @if (authService.isAdminRole()) { <th class="p-4"><span class="sr-only">Acciones</span></th> }
                </tr>
              </thead>
              <tbody>
                @for (row of rows(); track row.subscriber_id) {
                  <tr class="border-t border-slate-100">
                    <td class="p-4">
                      <a [routerLink]="['/subscribers', row.subscriber_id]" class="font-semibold text-blue-700 hover:underline">{{ row.owner_name ?? 'Suscriptor #' + row.subscriber_id }}</a>
                      <div class="text-xs text-slate-500">{{ row.owner_email }}</div>
                    </td>
                    <td class="p-4">{{ row.plan_name }}</td>
                    <td class="p-4">{{ row.ends_at ? (row.ends_at | date: 'dd/MM/yyyy') : '—' }}</td>
                    <td class="p-4">
                      @if (badgeFor(row); as badge) {
                        <span class="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border" [class]="toneClass[badge.tone]">{{ badge.label }}</span>
                      }
                    </td>
                    @if (authService.isAdminRole()) {
                      <td class="p-4 text-right">
                        <button type="button" (click)="openExtend(row)"
                          class="px-3 py-1 rounded-full bg-amber-500 text-white text-[9px] font-black uppercase tracking-widest hover:bg-amber-600 cursor-pointer">Extender</button>
                      </td>
                    }
                  </tr>
                }
              </tbody>
            </table>
            <div class="flex items-center justify-between p-4 text-xs text-slate-500 border-t border-slate-100">
              <span>{{ pagination()?.startIndex }}–{{ pagination()?.endIndex }} de {{ pagination()?.length }}</span>
              <span class="flex gap-2">
                <button type="button" class="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 cursor-pointer" [disabled]="page() === 0" (click)="page.set(page() - 1)">Anterior</button>
                <button type="button" class="px-3 py-1 rounded-lg border border-slate-200 disabled:opacity-40 cursor-pointer" [disabled]="page() >= (pagination()?.lastPage ?? 0)" (click)="page.set(page() + 1)">Siguiente</button>
              </span>
            </div>
          }
        </section>
      </div>
    </div>
  `,
})
export class SubscriptionExpirationsComponent {
  private subscriberService = inject(SubscriberService);
  private dialog = inject(MatDialog);
  authService = inject(AuthService);

  tabs: { group: ExpirationGroup; label: string; empty: string }[] = [
    { group: 'upcoming', label: 'Por vencer', empty: 'No hay planes por vencer en los próximos 7 días.' },
    { group: 'past_due', label: 'En gracia', empty: 'No hay planes en gracia.' },
    { group: 'suspended', label: 'Suspendidos', empty: 'No hay planes suspendidos.' },
  ];
  toneClass = EXPIRY_TONE_CLASS;

  group = signal<ExpirationGroup>('upcoming');
  page = signal(0);

  resource = rxResource({
    params: () => ({ group: this.group(), page: this.page() }),
    stream: ({ params }) => this.subscriberService.getExpirations(params.group, params.page),
  });
  rows = computed(() => this.resource.value()?.data.records ?? []);
  pagination = computed(() => this.resource.value()?.data.pagination ?? null);
  emptyMessage = computed(() => this.tabs.find((t) => t.group === this.group())?.empty ?? '');

  selectGroup(group: ExpirationGroup): void {
    this.group.set(group);
    this.page.set(0);
  }

  badgeFor(row: ExpirationRow) {
    return expiryBadge(row.status, row.ends_at, row.suspends_at, new Date());
  }

  openExtend(row: ExpirationRow): void {
    const ref = this.dialog.open(ExtendPlanDialogComponent, {
      panelClass: 'dialog-panel',
      data: { subscriberId: row.subscriber_id, ownerLabel: row.owner_name ?? `Suscriptor #${row.subscriber_id}`, status: row.status },
    });
    ref.afterClosed().subscribe((extended) => extended && this.resource.reload());
  }
}
