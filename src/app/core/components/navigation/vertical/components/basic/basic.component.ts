import { NgClass, NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    Input,
    OnDestroy,
    OnInit,
    inject,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
    IsActiveMatchOptions,
    RouterLink,
    RouterLinkActive,
} from '@angular/router';
import { QdooraNavigationService } from '@core/components/navigation/navigation.service';
import { QdooraNavigationItem } from '@core/components/navigation/navigation.types';
import { QdooraVerticalNavigationComponent } from '@core/components/navigation/vertical/vertical.component';
import { QdooraUtilsService } from '@core/services/utils/utils.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'qdoora-vertical-navigation-basic-item',
    templateUrl: './basic.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        NgClass,
        RouterLink,
        RouterLinkActive,
        MatTooltipModule,
        NgTemplateOutlet,
        MatIconModule,
    ],
})
export class QdooraVerticalNavigationBasicItemComponent
    implements OnInit, OnDestroy
{
    private _changeDetectorRef = inject(ChangeDetectorRef);
    private _qdooraNavigationService = inject(QdooraNavigationService);
    private _qdooraUtilsService = inject(QdooraUtilsService);

    @Input() item: QdooraNavigationItem;
    @Input() name: string;

    // Set the equivalent of {exact: false} as default for active match options.
    // We are not assigning the item.isActiveMatchOptions directly to the
    // [routerLinkActiveOptions] because if it's "undefined" initially, the router
    // will throw an error and stop working.
    isActiveMatchOptions: IsActiveMatchOptions =
        this._qdooraUtilsService.subsetMatchOptions;

    private _qdooraVerticalNavigationComponent: QdooraVerticalNavigationComponent;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Set the "isActiveMatchOptions" either from item's
        // "isActiveMatchOptions" or the equivalent form of
        // item's "exactMatch" option
        this.isActiveMatchOptions =
            this.item.isActiveMatchOptions ?? this.item.exactMatch
                ? this._qdooraUtilsService.exactMatchOptions
                : this._qdooraUtilsService.subsetMatchOptions;

        // Get the parent navigation component
        this._qdooraVerticalNavigationComponent =
            this._qdooraNavigationService.getComponent(this.name);

        // Mark for check
        this._changeDetectorRef.markForCheck();

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

    /**
     * Close the vertical navigation on click
     */
    closeNavigation(): void {
        if (this._qdooraVerticalNavigationComponent) {
            this._qdooraVerticalNavigationComponent.close();
        }
    }
}
