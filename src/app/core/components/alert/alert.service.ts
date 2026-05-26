import { Injectable } from '@angular/core';
import { AlertMessage } from '@app/core/models/common/alertMessage';

import { Observable, ReplaySubject, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class QdooraAlertService {

    private readonly _onDismiss = new ReplaySubject<string>(1);
    private readonly _onShow = new ReplaySubject<string>(1);
    private readonly _alertSubjects = new Map<string, ReplaySubject<AlertMessage>>();

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

    onAlert(name: string): Observable<AlertMessage> {
        if (!this._alertSubjects.has(name)) {
            this._alertSubjects.set(name, new ReplaySubject<AlertMessage>(1));
        }
        return this._alertSubjects.get(name)!.asObservable();
    }

    showAlert(alert: AlertMessage): void {
        if (!this._alertSubjects.has(alert.name)) {
            this._alertSubjects.set(alert.name, new ReplaySubject<AlertMessage>(1));
        }
        this._alertSubjects.get(alert.name)!.next(alert);
    }
    
    clearAlert(name: string): void {
        if (this._alertSubjects.has(name)) {
            this._alertSubjects.delete(name);
        }
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
