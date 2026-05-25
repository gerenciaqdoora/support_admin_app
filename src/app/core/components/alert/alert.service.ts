import { Injectable } from '@angular/core';
import { AlertMessage } from '@app/core/models/common/alertMessage';

import { Observable, ReplaySubject, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class QdooraAlertService {

    private readonly _onDismiss = new ReplaySubject<string>(1);
    private readonly _onShow = new ReplaySubject<string>(1);
    private readonly _onAlert = new Subject<AlertMessage>();

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for onDismiss
     */
    get onDismiss(): Observable<any> {
        return this._onDismiss.asObservable();
    }

    /**
     * Getter for onShow
     */
    get onShow(): Observable<any> {
        return this._onShow.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    onAlert(): Observable<AlertMessage> {
        return this._onAlert.asObservable();
    }

    showAlert(alert: AlertMessage): void {
        this._onAlert.next(alert);
    }

    /**
     * Dismiss the alert
     *
     * @param name
     */
    dismiss(name: string): void {
        // Return if the name is not provided
        if (!name) {
            return;
        }

        // Execute the observable
        this._onDismiss.next(name);
    }

    /**
     * Show the dismissed alert
     *
     * @param name
     */
    show(name: string): void {
        // Return if the name is not provided
        if (!name) {
            return;
        }

        // Execute the observable
        this._onShow.next(name);
    }
}
