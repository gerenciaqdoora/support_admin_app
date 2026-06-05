import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { SubscriberService } from '@core/services/subscriber.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { AuthService } from '@core/services/auth.service';
import { NotificationService } from '@core/services/notification.service';

@Component({
  selector: 'app-subscriber-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div
      class="h-full flex flex-col bg-[#f8fafc] text-slate-800 overflow-hidden font-sans relative"
    >
      @if (subscriberResource.isLoading()) {
        <div
          class="flex-1 flex flex-col items-center justify-center bg-white/60 backdrop-blur-md z-[100]"
        >
          <div
            class="w-16 h-16 border-[6px] border-blue-600 border-t-transparent rounded-full animate-spin shadow-[0_0_40px_rgba(37,99,235,0.3)]"
          ></div>
          <span
            class="text-[13px] font-black text-blue-600 uppercase tracking-[0.5em] mt-6 animate-pulse"
            >Cargando Expediente</span
          >
        </div>
      }

      @if (subscriberResource.error()) {
        <div class="flex-1 flex flex-col items-center justify-center p-10 text-center">
          <div
            class="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-sm border border-red-100"
          >
            ⚠️
          </div>
          <h2 class="text-xl font-black text-slate-900 uppercase tracking-tighter">
            Error de Sincronización
          </h2>
          <p class="text-slate-400 mt-2 max-w-md">
            No se pudo recuperar el expediente del suscriptor. Verifique la conexión con el servidor
            de soporte.
          </p>
          <button
            routerLink="/subscribers"
            class="mt-8 px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95"
          >
            Volver al Directorio
          </button>
        </div>
      }

      @if (data(); as subscriber) {
        <!-- Header de Detalle Premium -->
        <div
          class="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shrink-0 z-50 shadow-sm relative"
        >
          <div class="flex items-center gap-5">
            <a
              routerLink="/subscribers"
              class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-100"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  d="M15 19l-7-7 7-7"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </a>
            <div>
              <div class="flex items-center gap-3">
                <h1 class="text-xl font-black text-slate-900 tracking-tight uppercase leading-none">
                  {{ subscriber.record?.usuario?.name || 'Cargando...' }}
                </h1>
                <span
                  class="text-[10px] font-black px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-widest"
                  >ID #{{ subscriber.record?.id }}</span
                >
              </div>
              <div class="flex items-center gap-2 mt-2">
                <span class="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Expediente Detallado de Suscriptor
                </p>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <button
              class="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-sm cursor-pointer"
            >
              Enviar Notificación
            </button>

            @if (authService.isAdminRole()) {
              @if (subscriber.record?.deleted_at) {
                <button
                  (click)="confirmReactivate()"
                  [disabled]="isReactivating()"
                  class="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm cursor-pointer border bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  @if (isReactivating()) {
                    <span class="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></span>
                  }
                  Reactivar Cuenta
                </button>
              } @else {
                <button
                  (click)="confirmDelete()"
                  class="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-sm cursor-pointer border bg-red-50 text-red-500 border-red-100 hover:bg-red-100"
                >
                  Suspender Cuenta
                </button>
              }
            }
          </div>
        </div>

        <!-- Contenido Principal con Scroll -->
        <div class="flex-1 overflow-auto custom-scrollbar bg-slate-50/50">
          <div
            class="max-w-[1400px] mx-auto p-8 grid grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
          >
            <!-- Columna Izquierda: Perfil y Métricas -->
            <div class="col-span-12 lg:col-span-4 space-y-8">
              <!-- Card de Perfil -->
              <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="h-24 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
                  <div class="absolute -bottom-12 left-8 p-1.5 bg-white rounded-[2rem] shadow-xl">
                    <div
                      class="w-24 h-24 rounded-[1.7rem] bg-slate-900 text-white flex items-center justify-center text-4xl font-black shadow-inner uppercase"
                    >
                      {{ subscriber.record?.usuario?.name?.charAt(0) || '?' }}
                    </div>
                  </div>
                </div>
                <div class="pt-16 pb-8 px-8">
                  <h2 class="text-2xl font-black text-slate-900 tracking-tighter uppercase">
                    {{ subscriber.record?.usuario?.name }}
                  </h2>
                  <p class="text-sm text-slate-400 font-medium mb-6 lowercase">
                    {{ subscriber.record?.usuario?.email }}
                  </p>

                  <div class="flex flex-wrap gap-2">
                    @if (subscriber.record?.deleted_at) {
                      <span
                        class="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[9px] font-black uppercase tracking-widest border border-slate-200"
                        >Cuenta Suspendida</span
                      >
                    } @else if (subscriber.record?.es_demo) {
                      <span
                        class="px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest border border-amber-100"
                        >Trial / Demo</span
                      >
                    } @else {
                      <span
                        class="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest border border-emerald-100"
                        >Cuenta Activa</span
                      >
                    }
                    <span
                      class="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest border border-blue-100"
                    >
                      Plan {{ subscriber.metrics?.plan_name }}
                    </span>
                    @if (authService.isAdminRole()) {
                      <button
                        (click)="confirmForcePassword(subscriber.record?.usuario?.id || subscriber.record?.user_id)"
                        class="px-3 py-1 rounded-full bg-slate-50 text-slate-600 text-[9px] font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-1"
                        title="Forzar Cambio de Contraseña"
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                        Reset PWD
                      </button>
                    }
                  </div>
                </div>
                <div
                  class="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100 bg-slate-50/50"
                >
                  <div class="p-6 text-center">
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Miembro Desde
                    </p>
                    <p class="text-xs font-black text-slate-800">
                      {{ subscriber.record?.date_subscribed | date: 'dd MMM, yyyy' : '' : 'es-CL' }}
                    </p>
                  </div>
                  <div class="p-6 text-center">
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                      Vencimiento
                    </p>
                    <p class="text-xs font-black text-slate-800">
                      {{
                        subscriber.record?.subscription_valid_to
                          | date: 'dd MMM, yyyy' : '' : 'es-CL'
                      }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Métricas de Uso Forense -->
              <div class="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                <h3
                  class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-3"
                >
                  <span class="w-1.5 h-4 bg-blue-600 rounded-full"></span>
                  Métricas de Consumo
                </h3>
                <div class="space-y-6">
                  <div
                    class="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all"
                  >
                    <div class="flex justify-between items-center">
                      <div class="flex flex-col">
                        <span class="text-[10px] font-black text-slate-400 uppercase tracking-tight"
                          >Empresas Creadas</span
                        >
                        <span class="text-2xl font-black text-slate-900 mt-1">{{
                          subscriber.metrics?.total_companies || 0
                        }}</span>
                      </div>
                      <div
                        class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl"
                      >
                        🏢
                      </div>
                    </div>
                  </div>
                  <div
                    class="p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-200 transition-all"
                  >
                    <div class="flex justify-between items-center">
                      <div class="flex flex-col">
                        <span class="text-[10px] font-black text-slate-400 uppercase tracking-tight"
                          >Usuarios en Equipo</span
                        >
                        <span class="text-2xl font-black text-slate-900 mt-1">{{
                          subscriber.metrics?.total_users || 0
                        }}</span>
                      </div>
                      <div
                        class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl"
                      >
                        👥
                      </div>
                    </div>
                  </div>
                  <div
                    class="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 group hover:border-blue-400 transition-all"
                  >
                    <div class="flex justify-between items-center">
                      <div class="flex flex-col">
                        <span class="text-[10px] font-black text-blue-400 uppercase tracking-tight"
                          >Total Movimientos</span
                        >
                        <span class="text-2xl font-black text-blue-600 mt-1">{{
                          subscriber.metrics?.total_movements || 0
                        }}</span>
                      </div>
                      <div
                        class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl text-blue-600 font-black"
                      >
                        Σ
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Columna Derecha: Listados Detallados -->
            <div class="col-span-12 lg:col-span-8 space-y-8">
              <!-- Listado de Empresas -->
              <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div
                  class="px-8 py-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center"
                >
                  <h3 class="text-xs font-black text-slate-900 uppercase tracking-widest">
                    Empresas Asociadas
                  </h3>
                  <span
                    class="px-2.5 py-1 bg-white rounded-lg border border-slate-200 text-[10px] font-black text-slate-500"
                    >{{ subscriber.record?.empresas?.length || 0 }} Entidades</span
                  >
                </div>
                <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  @for (company of subscriber.record?.empresas; track company.id) {
                    <div
                      class="p-4 rounded-2xl border border-slate-100 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/5 transition-all group flex items-center gap-4 bg-white"
                    >
                      <div
                        class="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center text-lg group-hover:bg-blue-600 group-hover:text-white transition-all uppercase"
                      >
                        {{ company.social_reason?.charAt(0) || 'E' }}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="text-xs font-black text-slate-800 uppercase truncate">
                          {{ company.social_reason }}
                        </p>
                        <p
                          class="text-[9px] text-slate-400 font-bold uppercase tracking-tighter mt-0.5"
                        >
                          RUT: {{ company.rut }}
                        </p>
                        <div class="flex items-center gap-2 mt-2">
                          <span
                            class="text-[9px] font-black text-blue-600 px-1.5 py-0.5 bg-blue-50 rounded"
                            >{{ company.vouchers_count || 0 }} Comprobantes</span
                          >
                          <span class="text-[9px] font-bold text-slate-400"
                            >ID: #{{ company.id }}</span
                          >
                        </div>
                      </div>
                    </div>
                  } @empty {
                    <div
                      class="col-span-full py-12 text-center opacity-30 italic text-xs font-bold"
                    >
                      No hay empresas asociadas a este suscriptor.
                    </div>
                  }
                </div>
              </div>

              <!-- Tabla de Usuarios de Equipo -->
              <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="px-8 py-5 bg-slate-50 border-b border-slate-200">
                  <h3 class="text-xs font-black text-slate-900 uppercase tracking-widest">
                    Personal del Suscriptor
                  </h3>
                </div>
                <table class="w-full text-left border-separate border-spacing-0">
                  <thead>
                    <tr class="bg-slate-800 text-white">
                      <th
                        class="px-8 py-3 text-[9px] font-black uppercase tracking-widest border-r border-white/5"
                      >
                        Usuario
                      </th>
                      <th
                        class="px-8 py-3 text-[9px] font-black uppercase tracking-widest text-right"
                      >
                        Email / Contacto
                      </th>
                      <th class="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-right">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100">
                    @for (
                      member of subscriber.record?.team_users || subscriber.record?.teamUsers;
                      track member.id
                    ) {
                      <tr class="hover:bg-blue-50/30 transition-all group">
                        <td class="px-8 py-4">
                          <div class="flex items-center gap-3">
                            <div
                              class="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all uppercase"
                            >
                              {{ member.user?.name?.charAt(0) || 'U' }}
                            </div>
                            <span
                              class="text-xs font-black text-slate-800 uppercase tracking-tight"
                              >{{ member.user?.name }}</span
                            >
                            @if (member.user?.deleted_at) {
                              <span
                                class="text-[8px] font-black text-red-500 uppercase px-1.5 py-0.5 bg-red-50 rounded border border-red-100 ml-2"
                                >Suspendido</span
                              >
                            }
                          </div>
                        </td>
                        <td class="px-8 py-4 text-right">
                          <span
                            class="text-[10px] text-slate-500 font-bold tracking-tight lowercase"
                            >{{ member.user?.email }}</span
                          >
                        </td>
                        <td class="px-4 py-4 text-right">
                          @if (authService.isAdminRole()) {
                            <button
                              (click)="confirmForcePassword(member.user?.id || member.user_id)"
                              class="w-8 h-8 inline-flex rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-colors items-center justify-center cursor-pointer"
                              title="Forzar Cambio Contraseña"
                            >
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                              </svg>
                            </button>
                          }
                        </td>
                      </tr>
                    } @empty {
                      <tr>
                        <td
                          colspan="3"
                          class="py-12 text-center opacity-30 italic text-xs font-bold"
                        >
                          No hay personal asociado a este suscriptor.
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>

              <!-- Historial de Pagos Recientes -->
              <div class="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="px-8 py-5 bg-slate-50 border-b border-slate-200">
                  <h3 class="text-xs font-black text-slate-900 uppercase tracking-widest">
                    Historial de Facturación
                  </h3>
                </div>
                <div class="p-4">
                  <table class="w-full text-left">
                    <thead>
                      <tr class="text-slate-400">
                        <th class="px-4 py-2 text-[9px] font-black uppercase tracking-widest">
                          Fecha
                        </th>
                        <th class="px-4 py-2 text-[9px] font-black uppercase tracking-widest">
                          Referencia
                        </th>
                        <th
                          class="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-right"
                        >
                          Monto Total
                        </th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                      @for (pago of subscriber.record?.pagos; track pago.id) {
                        <tr class="hover:bg-slate-50 transition-colors">
                          <td class="px-4 py-4">
                            <span class="text-[10px] font-bold text-slate-600">{{
                              pago.created_at | date: 'dd/MM/yyyy HH:mm'
                            }}</span>
                          </td>
                          <td class="px-4 py-4">
                            <span
                              class="text-[10px] font-black text-slate-400 uppercase tracking-tighter"
                              >REF: {{ pago.payu_confirmation_id || 'LOCAL_POS' }}</span
                            >
                          </td>
                          <td class="px-4 py-4 text-right">
                            <span class="text-xs font-black text-slate-800"
                              >$ {{ pago.total || 0 | number: '1.0-0' }}</span
                            >
                          </td>
                        </tr>
                      } @empty {
                        <tr>
                          <td
                            colspan="3"
                            class="py-12 text-center opacity-20 italic text-xs font-bold"
                          >
                            No se registran pagos recientes.
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Diálogo de Confirmación Premium -->
      @if (isConfirmingDelete()) {
        <div
          class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        >
          <div
            class="bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300"
          >
            <div class="p-10 text-center">
              <div
                class="w-24 h-24 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center text-4xl mx-auto mb-8 shadow-sm border border-red-100"
              >
                ⚠️
              </div>
              <h2
                class="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-tight"
              >
                ¿Confirmar Baja Definitiva?
              </h2>
              <p class="text-slate-500 mt-4 text-sm font-medium leading-relaxed">
                Esta acción liberará el correo electrónico del suscriptor y desactivará el acceso de
                forma permanente.
                <span
                  class="block mt-2 font-black text-red-500 uppercase text-[10px] tracking-widest italic"
                  >Acción Irreversible</span
                >
              </p>

              <div class="grid grid-cols-2 gap-4 mt-10">
                <button
                  (click)="cancelDelete()"
                  [disabled]="isDeleting()"
                  class="px-6 py-4 bg-slate-50 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-100 transition-all active:scale-95 border border-slate-200 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  (click)="executeDelete()"
                  [disabled]="isDeleting()"
                  class="px-6 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-700 transition-all active:scale-95 shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  @if (isDeleting()) {
                    <div
                      class="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"
                    ></div>
                  }
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      }
        <!-- Modal de Confirmación Reactivación -->
        @if (isConfirmingReactivate()) {
          <div
            class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300"
          >
            <div
              class="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-emerald-100 animate-in zoom-in-95 duration-300"
            >
              <div
                class="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center text-4xl mb-8 mx-auto shadow-sm border border-emerald-100"
              >
                ♻️
              </div>
              <h2
                class="text-2xl font-black text-slate-900 text-center uppercase tracking-tighter leading-tight"
              >
                Reactivar Suscriptor
              </h2>
              <p class="text-slate-500 text-center mt-4 text-sm font-medium leading-relaxed">
                Esta acción restaurará el acceso al sistema para el titular y todo su equipo de
                trabajo. El correo electrónico volverá a su estado original.
              </p>

              <div
                class="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4"
              >
                <span class="text-xl">🛡️</span>
                <p class="text-[11px] font-bold text-amber-700 leading-relaxed uppercase">
                  Se validará automáticamente la vigencia del plan y la disponibilidad del correo
                  antes de proceder.
                </p>
              </div>

              <div class="flex flex-col gap-3 mt-10">
                <button
                  (click)="executeReactivate()"
                  [disabled]="isReactivating()"
                  class="w-full py-4 bg-emerald-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all active:scale-95 shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  @if (isReactivating()) {
                    <span
                      class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"
                    ></span>
                  }
                  Confirmar Reactivación
                </button>
                <button
                  (click)="cancelReactivate()"
                  class="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-95"
                >
                  Mantener Suspendida
                </button>
              </div>
            </div>
          </div>
        }

        <!-- Modal de Confirmación Cambio Contraseña -->
        @if (isConfirmingForcePwd()) {
          <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div class="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-blue-100 animate-in zoom-in-95 duration-300">
              <div class="w-20 h-20 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center text-4xl mb-8 mx-auto shadow-sm border border-blue-100">
                🔑
              </div>
              <h2 class="text-2xl font-black text-slate-900 text-center uppercase tracking-tighter leading-tight">
                Forzar Cambio Contraseña
              </h2>
              <p class="text-slate-500 text-center mt-4 text-sm font-medium leading-relaxed">
                Esta acción bloqueará el acceso al usuario hasta que actualice sus credenciales.
              </p>

              <div class="mt-8 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                <span class="text-xl">⚠️</span>
                <p class="text-[11px] font-bold text-amber-700 leading-relaxed uppercase">
                  El usuario será desconectado en su próxima interacción y deberá crear una nueva contraseña.
                </p>
              </div>

              <div class="flex flex-col gap-3 mt-10">
                <button
                  (click)="executeForcePassword()"
                  [disabled]="isForcingPwd()"
                  class="w-full py-4 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
                >
                  @if (isForcingPwd()) {
                    <span class="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  }
                  Confirmar Cambio
                </button>
                <button
                  (click)="cancelForcePassword()"
                  class="w-full py-4 bg-slate-50 text-slate-400 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 hover:text-slate-600 transition-all active:scale-95 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        }
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        overflow: hidden;
      }
      .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #f8fafc;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #e2e8f0;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #cbd5e1;
      }
    `,
  ],
})
export class SubscriberDetailComponent {
  private _route = inject(ActivatedRoute);
  private _router = inject(Router);
  private _subscriberService = inject(SubscriberService);
  public authService = inject(AuthService);
  private _notificationService = inject(NotificationService);

  // Estados reactivos para la baja y reactivación
  isConfirmingDelete = signal(false);
  isConfirmingReactivate = signal(false);
  isDeleting = signal(false);
  isReactivating = signal(false);
  isConfirmingForcePwd = signal(false);
  selectedUserIdForPwd = signal<number | null>(null);
  isForcingPwd = signal(false);

  // Usamos rxResource para una gestión de datos más reactiva y robusta (Angular 21)
  subscriberResource = rxResource({
    params: () => Number(this._route.snapshot.params['id']),
    stream: ({ params: id }) => this._subscriberService.getSubscriberById(id),
  });

  data = computed(() => {
    const res = this.subscriberResource.value();
    return res?.data || null;
  });

  confirmDelete(): void {
    this.isConfirmingDelete.set(true);
  }

  cancelDelete(): void {
    this.isConfirmingDelete.set(false);
  }

  executeDelete(): void {
    const id = Number(this._route.snapshot.params['id']);
    if (!id) return;

    this.isDeleting.set(true);

    this._subscriberService
      .deleteSubscriber(id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: () => {
          this.isConfirmingDelete.set(false);
          // Redirigir al listado tras el éxito
          this._router.navigate(['/subscribers']);
        },
        error: (err) => {
          console.error('Error al dar de baja:', err);
          // Aquí se podría integrar un Snackbar de error si existiera uno global
          this.isConfirmingDelete.set(false);
        },
      });
  }

  reactivateAccount(): void {
    // Solo mostramos el modal si es administrador
    if (this.authService.isAdminRole()) {
      this.confirmReactivate();
    }
  }

  confirmReactivate(): void {
    this.isConfirmingReactivate.set(true);
  }

  cancelReactivate(): void {
    this.isConfirmingReactivate.set(false);
  }

  executeReactivate(): void {
    const id = Number(this._route.snapshot.params['id']);
    if (!id) return;

    this.isReactivating.set(true);

    this._subscriberService
      .reactivateSubscriber(id)
      .pipe(finalize(() => this.isReactivating.set(false)))
      .subscribe({
        next: () => {
          this.isConfirmingReactivate.set(false);
          // Recargamos el recurso para actualizar la UI
          this.subscriberResource.reload();
        },
        error: (err) => {
          console.error('Error al reactivar:', err);
          const errorMsg = err.error?.message || 'No se pudo reactivar la cuenta.';
          // Alerta visual de plan vencido o colisión de correo
          this._notificationService.warning(errorMsg);
          this.isConfirmingReactivate.set(false);
        },
      });
  }

  confirmForcePassword(userId: number | undefined): void {
    if (userId && this.authService.isAdminRole()) {
      this.selectedUserIdForPwd.set(userId);
      this.isConfirmingForcePwd.set(true);
    }
  }

  cancelForcePassword(): void {
    this.isConfirmingForcePwd.set(false);
    this.selectedUserIdForPwd.set(null);
  }

  executeForcePassword(): void {
    const subscriberId = Number(this._route.snapshot.params['id']);
    const userId = this.selectedUserIdForPwd();
    if (!subscriberId || !userId) return;

    this.isForcingPwd.set(true);

    this._subscriberService
      .forcePasswordChange(subscriberId, userId)
      .pipe(finalize(() => this.isForcingPwd.set(false)))
      .subscribe({
        next: () => {
          this.isConfirmingForcePwd.set(false);
          this.selectedUserIdForPwd.set(null);
          this._notificationService.success('Se ha forzado el cambio de contraseña exitosamente.');
        },
        error: (err) => {
          console.error('Error al forzar cambio de contraseña:', err);
          const errorMsg = err.error?.message || 'No se pudo forzar el cambio de contraseña.';
          this._notificationService.error(errorMsg);
          this.isConfirmingForcePwd.set(false);
          this.selectedUserIdForPwd.set(null);
        },
      });
  }
}
