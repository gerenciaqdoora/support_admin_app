import { BooleanInput } from '@angular/cdk/coercion';
import { NgClass } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnDestroy,
    OnInit,
    forwardRef,
    inject,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { QdooraNavigationService } from '@core/components/navigation/navigation.service';
import { QdooraNavigationItem } from '@core/components/navigation/navigation.types';
import { QdooraVerticalNavigationBasicItemComponent } from '@core/components/navigation/vertical/components/basic/basic.component';
import { QdooraVerticalNavigationCollapsableItemComponent } from '@core/components/navigation/vertical/components/collapsable/collapsable.component';
import { QdooraVerticalNavigationDividerItemComponent } from '@core/components/navigation/vertical/components/divider/divider.component';
import { QdooraVerticalNavigationSpacerItemComponent } from '@core/components/navigation/vertical/components/spacer/spacer.component';
import { QdooraVerticalNavigationComponent } from '@core/components/navigation/vertical/vertical.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'qdoora-vertical-navigation-group-item',
    templateUrl: './group.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        NgClass,
        MatIconModule,
        QdooraVerticalNavigationBasicItemComponent,
        QdooraVerticalNavigationCollapsableItemComponent,
        QdooraVerticalNavigationDividerItemComponent,
        forwardRef(() => QdooraVerticalNavigationGroupItemComponent),
        QdooraVerticalNavigationSpacerItemComponent,
    ],
})
export class QdooraVerticalNavigationGroupItemComponent
    implements OnInit, OnDestroy
{
    /* eslint-disable @typescript-eslint/naming-convention */
    static ngAcceptInputType_autoCollapse: BooleanInput;
    /* eslint-enable @typescript-eslint/naming-convention */

    private _changeDetectorRef = inject(ChangeDetectorRef);
    private _qdooraNavigationService = inject(QdooraNavigationService);

    @Input() autoCollapse: boolean;
    @Input() item: QdooraNavigationItem;
    @Input() name: string;

    private _qdooraVerticalNavigationComponent: QdooraVerticalNavigationComponent;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Get the parent navigation component
        this._qdooraVerticalNavigationComponent =
            this._qdooraNavigationService.getComponent(this.name);

        // Subscribe to onRefreshed on the navigation component
        this._qdooraVerticalNavigationComponent.onRefreshed
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(() => {
                // Mark for check
                this._changeDetectorRef.markForCheck();
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
     * Track by function for ngFor loops
     *
     * @param index
     * @param item
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
}
