import { CommonModule } from '@angular/common';
import { Component, Input, ViewEncapsulation } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RutFormatPipe } from '@core/pipes/rut-format.pipe';

@Component({
    selector: 'app-dialog-employee-info',
    standalone: true,
    imports: [CommonModule, MatTooltipModule, RutFormatPipe],
    template: `
        <div
            class="border-b bg-white"
            [ngClass]="variant === 'wide' ? 'p-3 px-6' : 'p-4 sm:p-5'"
        >
            <!-- Versión COMPACTA (Original para HE/AU) -->
            <ng-container *ngIf="variant === 'compact'">
                <div class="flex flex-row items-center justify-between gap-4">
                    <div class="flex min-w-0 flex-col">
                        <span
                            class="text-secondary mb-1 text-[10px] font-black uppercase leading-none tracking-widest"
                            >Empleado</span
                        >
                        <h2
                            class="truncate text-xl font-black uppercase leading-none tracking-tight text-slate-800"
                        >
                            {{ name }}
                        </h2>
                        <div
                            class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1"
                        >
                            <div class="flex items-center gap-1.5">
                                <span
                                    class="text-[10px] font-black italic text-slate-500"
                                    >{{ rut | rutFormat }}</span
                                >
                            </div>
                            <div class="flex items-center gap-1.5">
                                <span
                                    class="text-secondary text-[10px] font-bold uppercase tracking-tighter"
                                    >Período:</span
                                >
                                <span
                                    class="text-[10px] font-black italic text-slate-500"
                                    >{{ period }}</span
                                >
                            </div>
                        </div>
                    </div>

                    <div
                        class="flex min-w-[120px] flex-col items-end rounded-xl border border-slate-200 bg-slate-50 p-2 px-3 shadow-sm"
                    >
                        <span
                            class="text-secondary mb-0.5 text-[9px] font-bold uppercase tracking-tighter"
                            >Sueldo Base</span
                        >
                        <span
                            class="text-lg font-black italic leading-none text-primary"
                            >$ {{ salary | number: '1.0-0' }}</span
                        >
                    </div>
                </div>

                <div class="mt-4 grid grid-cols-3 gap-3">
                    <div
                        class="flex cursor-help items-center justify-center gap-2 rounded-lg border border-slate-200 bg-slate-50/50 p-1.5 text-center"
                        matTooltip="Días de jornada contratada (Base 30)"
                    >
                        <span
                            class="text-secondary text-[9px] font-bold uppercase tracking-tight"
                            >Jornada:</span
                        >
                        <span
                            class="text-base font-black italic leading-none text-slate-400"
                            >{{ contractedDays }}</span
                        >
                    </div>
                    <div
                        class="flex cursor-help items-center justify-center gap-2 rounded-lg border border-primary-100 bg-primary-50 p-1.5 text-center"
                        matTooltip="Total de días trabajados efectivamente en el período"
                    >
                        <span
                            class="text-nowrap text-[9px] font-bold uppercase tracking-tight text-primary"
                            >T. Trab:</span
                        >
                        <span
                            class="text-base font-black italic leading-none text-primary"
                            >{{ workedDays }}</span
                        >
                    </div>
                    <div
                        class="flex cursor-help items-center justify-center gap-2 rounded-lg border border-amber-100 bg-amber-50 p-1.5 text-center"
                        matTooltip="Total de días de ausencia o licencias registradas"
                    >
                        <span
                            class="text-nowrap text-[9px] font-bold uppercase tracking-tight text-amber-600"
                            >T. Ausent:</span
                        >
                        <span
                            class="text-base font-black italic leading-none text-amber-600"
                            >{{ absentDays }}</span
                        >
                    </div>
                </div>
            </ng-container>

            <!-- Versión WIDE (Para Haberes y Descuentos) -->
            <ng-container *ngIf="variant === 'wide'">
                <div class="flex items-center justify-between gap-6">
                    <!-- Info Empleado -->
                    <div class="flex min-w-0 flex-1 flex-col">
                        <span
                            class="text-secondary mb-1 text-[9px] font-black uppercase leading-none tracking-widest"
                            >Empleado</span
                        >
                        <h2
                            class="truncate text-lg font-black uppercase leading-none tracking-tight text-slate-800"
                        >
                            {{ name }}
                        </h2>
                        <div class="mt-1.5 flex items-center gap-4">
                            <span
                                class="text-[10px] font-black italic leading-none text-slate-400"
                                >{{ rut | rutFormat }}</span
                            >
                            <span class="text-slate-200">|</span>
                            <span
                                class="text-[10px] font-black italic leading-none text-slate-400"
                                >Período: {{ period }}</span
                            >
                        </div>
                    </div>

                    <!-- Resumen Central -->
                    <div class="flex items-center gap-3">
                        <div
                            class="flex min-w-[100px] cursor-help items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2"
                            matTooltip="Días de jornada contratada (Base 30)"
                        >
                            <span
                                class="text-secondary text-[9px] font-bold uppercase tracking-tight"
                                >Jornada:</span
                            >
                            <span
                                class="text-lg font-black italic leading-none text-slate-300"
                                >{{ contractedDays }}</span
                            >
                        </div>
                        <div
                            class="flex min-w-[100px] cursor-help items-center justify-center gap-2 rounded-xl border border-primary-100 bg-primary-50 px-3 py-2"
                            matTooltip="Total de días trabajados efectivamente en el período"
                        >
                            <span
                                class="text-[9px] font-bold uppercase tracking-tight text-primary"
                                >T. Trab:</span
                            >
                            <span
                                class="text-lg font-black italic leading-none text-primary"
                                >{{ workedDays }}</span
                            >
                        </div>
                        <div
                            class="flex min-w-[100px] cursor-help items-center justify-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2"
                            matTooltip="Total de días de ausencia o licencias registradas"
                        >
                            <span
                                class="text-[9px] font-bold uppercase tracking-tight text-amber-600"
                                >T. Ausent:</span
                            >
                            <span
                                class="text-lg font-black italic leading-none text-amber-600"
                                >{{ absentDays }}</span
                            >
                        </div>
                    </div>

                    <!-- Sueldo Base (Derecha) -->
                    <div
                        class="flex min-w-[140px] flex-col items-end rounded-xl border border-slate-200 bg-slate-50 p-1.5 px-4 shadow-sm"
                    >
                        <span
                            class="text-secondary mb-0.5 text-[9px] font-bold uppercase tracking-tighter"
                            >Sueldo Base</span
                        >
                        <span
                            class="text-xl font-black italic leading-none tracking-tight text-primary"
                            >$ {{ salary | number: '1.0-0' }}</span
                        >
                    </div>
                </div>
            </ng-container>
        </div>
    `,
    styles: [
        `
            :host {
                display: block;
                width: 100%;
            }
        `,
    ],
    encapsulation: ViewEncapsulation.None,
})
export class DialogEmployeeInfoComponent {
    @Input() name: string = '';
    @Input() rut: string = '';
    @Input() docType: string = 'RUT';
    @Input() period: string = '';
    @Input() salary: number | string = 0;

    // Resumen de Jornada
    @Input() contractedDays: number = 30;
    @Input() workedDays: number = 30;
    @Input() absentDays: number = 0;
    @Input() variant: 'compact' | 'wide' = 'compact';
}
