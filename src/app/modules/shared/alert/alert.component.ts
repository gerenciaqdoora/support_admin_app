import { CommonModule } from '@angular/common';
import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, Output, EventEmitter, ViewEncapsulation, OnInit, inject, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { QdooraAlertComponent, QdooraAlertService } from '@app/core/components/alert';
import { AlertMessage } from '@app/core/models/common/alertMessage';
import { qdooraAnimations } from '@core/animations';

import { Subject, filter, takeUntil } from 'rxjs';

@Component({
    selector: 'app-shared-alert',
    standalone: true,
    templateUrl: './alert.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    encapsulation: ViewEncapsulation.None,
    animations: qdooraAnimations,
    imports: [
        CommonModule,
        QdooraAlertComponent,
    ],
    host: {
        '[class.hidden]': '!alertMessage || isDismissed'
    }
})
export class SharedAlertComponent
    implements OnInit, AfterViewInit, OnDestroy {

    @Input() name!: string;

    @ViewChild('alertContainer') alertContainer?: ElementRef;

    alertMessage: AlertMessage | null = null;
    isDismissed: boolean = false;
    private _qdooraAlertService = inject(QdooraAlertService);
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _cd: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        // Escuchar dismiss
        this._qdooraAlertService.onDismiss
            .pipe(
                filter((name) => this.name === name),
                takeUntil(this._unsubscribeAll)
            )
            .subscribe(() => this.onDismissed());

        // Suscribirse a los eventos de alerta de esta alerta específica
        this._qdooraAlertService.onAlert(this.name)
            .pipe(
                takeUntil(this._unsubscribeAll)
            )
            .subscribe((alert: AlertMessage) => {
                // Cambio de alerta
                this.alertMessage = alert;
                this.isDismissed = false;
                this._cd.markForCheck();

                // Avisamos
                this._qdooraAlertService.show(alert.name);

                // Focus automático
                setTimeout(() => {
                    if (this.alertContainer) {
                        this.alertContainer.nativeElement.focus();
                    }
                }, 100);
            });
    }

    ngAfterViewInit(): void {
        // Reservado por si se requiere manipular el DOM tras la inicialización
    }

    onDismissed() {
        setTimeout(() => {
            this.isDismissed = true;
            this._cd.markForCheck();
        }, 250); // Dar tiempo a la animación interna de la alerta
    }

    ngOnDestroy(): void {
        // Limpiamos la alerta de la memoria de la sesión global (atomicidad)
        this._qdooraAlertService.clearAlert(this.name);
        
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
