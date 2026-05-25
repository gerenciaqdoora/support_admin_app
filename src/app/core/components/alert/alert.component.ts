import { BooleanInput, coerceBooleanProperty } from '@angular/cdk/coercion';

import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    EventEmitter,
    HostBinding,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
    ViewEncapsulation,
    inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { qdooraAnimations } from '@core/animations';
import { QdooraAlertService } from '@core/components/alert/alert.service';
import {
    QdooraAlertAppearance,
    QdooraAlertType,
} from '@core/components/alert/alert.types';
import { QdooraUtilsService } from '@core/services/utils/utils.service';
import { Subject, filter, takeUntil } from 'rxjs';

@Component({
    selector: 'qdoora-alert',
    templateUrl: './alert.component.html',
    styleUrls: ['./alert.component.scss'],
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    animations: qdooraAnimations,
    exportAs: 'qdooraAlert',
    standalone: true,
    imports: [MatIconModule, MatButtonModule],
})
export class QdooraAlertComponent implements OnChanges, OnInit, OnDestroy {
    /* eslint-disable @typescript-eslint/naming-convention */
    static ngAcceptInputType_dismissible: BooleanInput;
    static ngAcceptInputType_dismissed: BooleanInput;
    static ngAcceptInputType_showIcon: BooleanInput;
    /* eslint-enable @typescript-eslint/naming-convention */

    private _changeDetectorRef = inject(ChangeDetectorRef);
    private _qdooraAlertService = inject(QdooraAlertService);
    private _qdooraUtilsService = inject(QdooraUtilsService);

    @Input() appearance: QdooraAlertAppearance = 'soft';
    @Input() dismissed: boolean = false;
    @Input() dismissible: boolean = false;
    @Input() name: string = this._qdooraUtilsService.randomId();
    @Input() showIcon: boolean = true;
    @Input() type: QdooraAlertType = 'primary';
    @Input() actionText: string = 'Acción';
    @Input() showActionButton: boolean = false;
    @Output() readonly dismissedChanged: EventEmitter<boolean> = new EventEmitter<boolean>();
    @Output() readonly actionClicked: EventEmitter<void> = new EventEmitter<void>();
    @Output() readonly close: EventEmitter<string> = new EventEmitter<string>();

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Host binding for component classes
     */
    @HostBinding('class') get classList(): any {
        /* eslint-disable @typescript-eslint/naming-convention */
        return {
            'qdoora-alert-appearance-border': this.appearance === 'border',
            'qdoora-alert-appearance-fill': this.appearance === 'fill',
            'qdoora-alert-appearance-outline': this.appearance === 'outline',
            'qdoora-alert-appearance-soft': this.appearance === 'soft',
            'qdoora-alert-dismissed': this.dismissed,
            'qdoora-alert-dismissible': this.dismissible,
            'qdoora-alert-show-icon': this.showIcon,
            'qdoora-alert-type-primary': this.type === 'primary',
            'qdoora-alert-type-accent': this.type === 'accent',
            'qdoora-alert-type-warn': this.type === 'warn',
            'qdoora-alert-type-basic': this.type === 'basic',
            'qdoora-alert-type-info': this.type === 'info',
            'qdoora-alert-type-success': this.type === 'success',
            'qdoora-alert-type-warning': this.type === 'warning',
            'qdoora-alert-type-error': this.type === 'error',
        };
        /* eslint-enable @typescript-eslint/naming-convention */
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On changes
     *
     * @param changes
     */
    ngOnChanges(changes: SimpleChanges): void {
        // Dismissed
        if ('dismissed' in changes) {
            // Coerce the value to a boolean
            this.dismissed = coerceBooleanProperty(
                changes.dismissed.currentValue
            );

            // Dismiss/show the alert
            this._toggleDismiss(this.dismissed);
        }

        // Dismissible
        if ('dismissible' in changes) {
            // Coerce the value to a boolean
            this.dismissible = coerceBooleanProperty(
                changes.dismissible.currentValue
            );
        }

        // Show icon
        if ('showIcon' in changes) {
            // Coerce the value to a boolean
            this.showIcon = coerceBooleanProperty(
                changes.showIcon.currentValue
            );
        }
    }

    /**
     * On init
     */
    ngOnInit(): void {
        // Subscribe to the dismiss calls
        this._qdooraAlertService.onDismiss
            .pipe(
                filter((name) => this.name === name),
                takeUntil(this._unsubscribeAll)
            )
            .subscribe(() => {
                // Dismiss the alert
                this.dismiss();
            });

        // Subscribe to the show calls
        this._qdooraAlertService.onShow
            .pipe(
                filter((name) => this.name === name),
                takeUntil(this._unsubscribeAll)
            )
            .subscribe(() => {
                // Show the alert
                this.show();
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Dismiss the alert
     */
    dismiss(): void {
        this.close.emit(this.name);

        // Return if the alert is already dismissed
        if (this.dismissed) {
            return;
        }

        // Dismiss the alert
        this._toggleDismiss(true);
    }

    /**
     * Show the dismissed alert
     */
    show(): void {
        // Return if the alert is already showing
        if (!this.dismissed) {
            return;
        }

        // Show the alert
        this._toggleDismiss(false);
    }

    /**
     * Emit event to make actions
     */
    onActionClick(): void {
        this.actionClicked.emit();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Dismiss/show the alert
     *
     * @param dismissed
     * @private
     */
    private _toggleDismiss(dismissed: boolean): void {
        // Return if the alert is not dismissible
        if (!this.dismissible) {
            return;
        }

        // Set the dismissed
        this.dismissed = dismissed;

        // Execute the observable
        this.dismissedChanged.next(this.dismissed);

        // Notify the change detector
        this._changeDetectorRef.markForCheck();
    }
}
