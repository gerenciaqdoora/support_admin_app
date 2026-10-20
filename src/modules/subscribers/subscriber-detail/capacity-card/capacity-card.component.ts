import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { DimensionCapacity, SubscriberService } from '@core/services/subscriber.service';
import { NotificationService } from '@core/services/notification.service';
import { GrantAddonDialogComponent } from '../grant-addon-dialog/grant-addon-dialog.component';

/** Uso y límite de usuarios y empresas, cupos extra y alerta de Aduana. */
@Component({
  selector: 'app-capacity-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  template: `
    <section class="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4" aria-labelledby="capacity-title">
      <div class="flex items-center justify-between">
        <h3 id="capacity-title" class="text-[11px] font-black uppercase tracking-widest text-slate-700">Capacidad</h3>
        @if (canManage() && capacity()?.plan_id) {
          <button type="button" (click)="openGrant()"
            class="px-3 py-1 rounded-full bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 cursor-pointer">
            Dar cupos
          </button>
        }
      </div>

      @if (capacityResource.isLoading()) {
        <p class="text-sm text-slate-500">Cargando capacidad…</p>
      } @else if (capacityResource.error()) {
        <p class="text-sm text-red-600">
          No se pudo cargar la capacidad.
          <button type="button" class="underline cursor-pointer" (click)="capacityResource.reload()">Reintentar</button>
        </p>
      } @else if (capacity(); as cap) {
        @for (row of rows(); track row.key) {
          <div class="flex flex-col gap-1">
            <div class="flex justify-between text-sm">
              <span class="font-semibold text-slate-700">{{ row.label }}</span>
              <span [class]="row.dim.exceeds ? 'text-red-600 font-bold' : 'text-slate-600'">{{ row.dim.usage }} / {{ row.dim.limit }}</span>
            </div>
            <div class="h-2 rounded-full bg-slate-100 overflow-hidden" role="progressbar" [attr.aria-label]="row.label"
              [attr.aria-valuenow]="row.dim.usage" aria-valuemin="0" [attr.aria-valuemax]="row.dim.limit">
              <div class="h-full" [class]="row.dim.exceeds ? 'bg-red-500' : 'bg-blue-500'" [style.width.%]="percent(row.dim)"></div>
            </div>
            <p class="text-xs text-slate-500">Tramo {{ row.dim.tier ?? '—' }} ({{ row.dim.tier_max }}) + {{ row.dim.addons }} extra</p>
          </div>
        }

        @if (cap.companies.aduana_capped) {
          <p class="text-xs text-slate-600">El plan incluye Aduana: máximo 1 empresa, sin cupos extra de empresas.</p>
          @if (cap.companies.exceeds) {
            <p role="alert" class="text-xs font-bold text-red-600">
              Excede el límite de Aduana: tiene {{ cap.companies.usage }} empresas. Regularízalo con el cliente.
            </p>
          }
        }

        <div class="flex flex-col gap-2">
          <h4 class="text-[10px] font-black uppercase tracking-widest text-slate-500">Cupos extra</h4>
          @for (addon of cap.addons; track addon.id) {
            <div class="flex flex-wrap items-center justify-between gap-2 text-sm border-t border-slate-100 pt-2">
              <span [class]="addon.revoked_at ? 'line-through text-slate-400' : 'text-slate-700'">
                +{{ addon.quantity }} {{ addon.dimension === 'users' ? 'usuarios' : 'empresas' }} · {{ addon.reason }}
                · {{ addon.valid_from | date: 'dd/MM/yyyy' }}
              </span>
              @if (canManage() && !addon.revoked_at) {
                @if (revokingId() === addon.id) {
                  <span class="flex items-center gap-2">
                    <label class="sr-only" [for]="'revoke-reason-' + addon.id">Motivo de la revocación</label>
                    <input [id]="'revoke-reason-' + addon.id" type="text" maxlength="255" placeholder="Motivo"
                      class="border border-slate-200 rounded-lg px-2 py-1 text-xs"
                      [value]="revokeReason()" (input)="revokeReason.set($any($event.target).value)" />
                    <button type="button" class="text-xs font-bold text-red-600 disabled:opacity-50 cursor-pointer"
                      [disabled]="!revokeReason().trim() || isRevoking()" (click)="confirmRevoke(addon.id)">Confirmar</button>
                    <button type="button" class="text-xs text-slate-500 cursor-pointer" (click)="revokingId.set(null)">Cancelar</button>
                  </span>
                } @else {
                  <button type="button" class="text-xs font-bold text-red-600 cursor-pointer" (click)="startRevoke(addon.id)">Revocar</button>
                }
              }
            </div>
          } @empty {
            <p class="text-xs text-slate-500">Sin cupos extra.</p>
          }
        </div>
      }
    </section>
  `,
})
export class CapacityCardComponent {
  private subscriberService = inject(SubscriberService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  subscriberId = input.required<number>();
  canManage = input(false);

  revokingId = signal<number | null>(null);
  revokeReason = signal('');
  isRevoking = signal(false);

  capacityResource = rxResource({
    params: () => this.subscriberId(),
    stream: ({ params: id }) => this.subscriberService.getCapacity(id),
  });
  capacity = computed(() => this.capacityResource.value()?.data ?? null);
  rows = computed(() => {
    const cap = this.capacity();
    return cap
      ? [
          { key: 'users', label: 'Usuarios de equipo', dim: cap.users },
          { key: 'companies', label: 'Empresas', dim: cap.companies },
        ]
      : [];
  });

  percent(dim: DimensionCapacity): number {
    return dim.limit > 0 ? Math.min(100, Math.round((dim.usage / dim.limit) * 100)) : 100;
  }

  openGrant(): void {
    const cap = this.capacity();
    const ref = this.dialog.open(GrantAddonDialogComponent, {
      panelClass: 'dialog-panel',
      data: {
        subscriberId: this.subscriberId(),
        aduanaCapped: !!cap?.companies.aduana_capped,
        current: {
          users: { limit: cap?.users.limit ?? 0, usage: cap?.users.usage ?? 0 },
          companies: { limit: cap?.companies.limit ?? 0, usage: cap?.companies.usage ?? 0 },
        },
      },
    });
    ref.afterClosed().subscribe((granted) => granted && this.capacityResource.reload());
  }

  startRevoke(addonId: number): void {
    this.revokeReason.set('');
    this.revokingId.set(addonId);
  }

  confirmRevoke(addonId: number): void {
    this.isRevoking.set(true);
    this.subscriberService
      .revokeAddon(this.subscriberId(), addonId, this.revokeReason().trim())
      .pipe(finalize(() => this.isRevoking.set(false)))
      .subscribe({
        next: () => {
          this.revokingId.set(null);
          this.notification.success('Cupo revocado.');
          this.capacityResource.reload();
        },
        error: (err) => this.notification.warning(err.error?.message ?? 'No se pudo revocar el cupo.'),
      });
  }
}
