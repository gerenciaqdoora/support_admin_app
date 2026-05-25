import { Injectable } from '@angular/core';
import { QdooraDrawerComponent } from '@core/components/drawer/drawer.component';

@Injectable({ providedIn: 'root' })
export class QdooraDrawerService {
    private _componentRegistry: Map<string, QdooraDrawerComponent> = new Map<
        string,
        QdooraDrawerComponent
    >();

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Register drawer component
     *
     * @param name
     * @param component
     */
    registerComponent(name: string, component: QdooraDrawerComponent): void {
        this._componentRegistry.set(name, component);
    }

    /**
     * Deregister drawer component
     *
     * @param name
     */
    deregisterComponent(name: string): void {
        this._componentRegistry.delete(name);
    }

    /**
     * Get drawer component from the registry
     *
     * @param name
     */
    getComponent(name: string): QdooraDrawerComponent | undefined {
        return this._componentRegistry.get(name);
    }
}
