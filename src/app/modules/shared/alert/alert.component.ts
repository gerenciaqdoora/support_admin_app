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
        '[class.hidden]': '!alertMessage || alertMessage.dismissed'
    }
})
export class SharedAlertComponent
    implements OnInit, AfterViewInit, OnDestroy {

    @Input() name!: string;
    @Output() readonly actionClicked: EventEmitter<string> = new EventEmitter<string>();

    @ViewChild('alertContainer') alertContainer?: ElementRef;

    alertMessage: AlertMessage | null = null;
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
    }

    ngAfterViewInit(): void {
        // Suscribirse a los eventos de alerta
        this._qdooraAlertService.onAlert()
            .pipe(
                filter((alert: AlertMessage) => this.name === alert.name),
                takeUntil(this._unsubscribeAll)
            )
            .subscribe((alert: AlertMessage) => {

                // Cambio de alerta
                this.alertMessage = alert;
                this._cd.markForCheck();

                // Avisamos
                this._qdooraAlertService.show(alert.name);

                if (alert.timeout) {
                    setTimeout(() => {
                        this._qdooraAlertService.dismiss(alert.name);
                        this._cd.markForCheck();
                    }, alert.timeout);
                }

                // Focus automático
                setTimeout(() => {
                    if (this.alertContainer) {
                        this.alertContainer.nativeElement.focus();
                    }
                }, 100);
            });
    }

    onDismissed() {
        // Obligamos a desaparecer la alerta
        if (this.alertMessage) {
            this.alertMessage.dismissible = true;
            this.alertMessage.dismissed = true;
            this._cd.markForCheck();
        }
    }

    goToAction(): void {
        if (this.alertMessage?.action_clicked) {
            this.actionClicked.emit(this.alertMessage.action_clicked);
        }
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
