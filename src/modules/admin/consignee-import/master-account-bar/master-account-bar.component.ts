import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { AccountCheck, MasterAccountSummary } from '@core/models/supplier-import.model';
import { AccountWarning } from '../account-warning';

type Tone = 'ok' | 'warn' | 'neutral';

/**
 * Barra de la cuenta maestra de una importación por rol: muestra la cuenta vigente, la cuenta mayor del archivo
 * y su estado (coincide / requiere resolver), con la acción de reasignar cuando corresponde.
 * No decide nada: recibe el estado ya calculado y emite `reassign`.
 */
@Component({
  selector: 'app-master-account-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section [class]="'shrink-0 border-b px-8 py-3 ' + styles().bar" [attr.role]="tone() === 'warn' ? 'alert' : null" aria-label="Cuenta maestra">
      <div class="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div class="flex items-center gap-3 min-w-0">
          <span [class]="'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ' + styles().icon" aria-hidden="true">
            @if (tone() === 'ok') {
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5"><path fill-rule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.8a1 1 0 0 1 1.4 0Z" clip-rule="evenodd"/></svg>
            } @else if (tone() === 'warn') {
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5"><path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clip-rule="evenodd"/></svg>
            } @else {
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8" class="h-5 w-5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h10"/></svg>
            }
          </span>
          <div class="min-w-0">
            <p class="text-[10px] font-black uppercase tracking-widest text-slate-500">Cuenta maestra · {{ label() }}</p>
            @if (master(); as m) {
              <p class="mt-0.5 truncate text-sm text-slate-900"><span class="font-mono font-black mr-1.5">{{ m.display_code }}</span><span class="font-semibold">· {{ m.name }}</span></p>
            } @else {
              <p class="mt-0.5 text-sm font-bold text-amber-800">Sin cuenta maestra asignada</p>
            }
          </div>
        </div>

        @if (fileCodes().length) {
          <div class="min-w-0 border-l border-slate-200/80 pl-6">
            <p class="text-[10px] font-black uppercase tracking-widest text-slate-500">Cuenta mayor del archivo</p>
            <p class="mt-0.5 text-sm font-mono font-black text-slate-900">{{ fileCodes().join(', ') }}</p>
          </div>
        }

        <div class="ml-auto flex items-center gap-3">
          <span [class]="'inline-flex items-center rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ' + styles().pill">{{ statusText() }}</span>
          @if (assignable()) {
            <button type="button" (click)="assign.emit()" [disabled]="busy()"
              class="cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 shrink-0 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-blue-600">
              {{ master() ? 'Cambiar cuenta' : 'Asignar cuenta' }}
            </button>
          }
          @if (warning()?.actionLabel; as action) {
            <button type="button" (click)="reassign.emit()" [disabled]="busy()"
              class="cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 shrink-0 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 focus-visible:outline-2 focus-visible:outline-amber-700">
              {{ action }}
            </button>
          }
        </div>
      </div>

      @if (note(); as n) {
        <p class="mt-3 text-xs text-slate-600">{{ n }}</p>
      }

      @if (warning(); as w) {
        <div class="mt-3 text-xs text-amber-900">
          <p class="font-semibold">{{ w.message }} @if (blocking()) { <span class="font-black">No se puede ejecutar hasta resolverlo.</span> }</p>
          @if (w.hint) { <p class="mt-0.5 text-amber-800">{{ w.hint }}</p> }
        </div>
      }
    </section>
  `,
})
export class MasterAccountBarComponent {
  /** Nombre de la cuenta maestra del rol (p. ej. «Proveedor Nacional»). */
  readonly label = input.required<string>();
  readonly master = input<MasterAccountSummary | null>(null);
  /** Resultado de comparar con el archivo; ausente antes de subirlo. */
  readonly check = input<AccountCheck | null | undefined>(null);
  readonly warning = input<AccountWarning | null>(null);
  readonly busy = input(false);

  /** La cuenta se elige desde el plan de la empresa (importaciones sin archivo que la dicte). */
  readonly assignable = input(false);
  /** Aclaración bajo la barra (p. ej. para qué se usa la cuenta). */
  readonly note = input<string | null>(null);
  /** Texto del estado cuando la barra no compara con un archivo (p. ej. «Asociada a IVA GENERAL»). */
  readonly statusLabel = input<string | null>(null);
  /** La cuenta está bien: pinta la barra en verde. */
  readonly ok = input(false);
  /** El aviso impide ejecutar (la cuenta maestra del rol); las cuentas adicionales no bloquean. */
  readonly blocking = input(true);

  readonly reassign = output<void>();
  readonly assign = output<void>();

  protected readonly fileCodes = computed(() => this.check()?.file_codes ?? []);

  protected readonly tone = computed<Tone>(() => {
    if (this.warning() || !this.master()) return 'warn';
    if (this.ok()) return 'ok';
    return this.check()?.matches === true ? 'ok' : 'neutral';
  });

  protected readonly statusText = computed(() => {
    if (!this.master()) return 'Sin asignar';
    if (this.warning() && this.statusLabel()) return this.statusLabel()!;
    if (this.ok() && this.statusLabel()) return this.statusLabel()!;
    if (this.assignable()) return 'Vigente en el plan';
    if (this.warning()) return 'Distinta del archivo';
    const check = this.check();
    if (check?.matches === true) return 'Coincide con el archivo';
    return check ? 'El archivo no trae cuenta mayor' : 'Vigente';
  });

  protected readonly styles = computed(() => {
    switch (this.tone()) {
      case 'ok': return { bar: 'bg-emerald-50/60 border-emerald-200', icon: 'bg-emerald-100 text-emerald-700', pill: 'bg-emerald-100 text-emerald-800' };
      case 'warn': return { bar: 'bg-amber-50 border-amber-200', icon: 'bg-amber-100 text-amber-700', pill: 'bg-amber-100 text-amber-800' };
      default: return { bar: 'bg-white border-slate-200', icon: 'bg-slate-100 text-slate-600', pill: 'bg-slate-100 text-slate-700' };
    }
  });
}
