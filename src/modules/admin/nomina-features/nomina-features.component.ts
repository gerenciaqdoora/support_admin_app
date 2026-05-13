import { Component, inject, OnInit, signal, DestroyRef, computed } from '@angular/core';
import { CommonModule, KeyValuePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NominaFeatureService } from './services/nomina-feature.service';
import { GlobalNominaFeature } from './models/nomina-feature.interface';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-nomina-features',
  standalone: true,
  imports: [CommonModule, FormsModule, KeyValuePipe],
  templateUrl: './nomina-features.component.html',
})
export default class NominaFeaturesComponent implements OnInit {
  private readonly _nominaFeatureService = inject(NominaFeatureService);
  private readonly _destroyRef = inject(DestroyRef);

  readonly features = this._nominaFeatureService.features;
  readonly loading = this._nominaFeatureService.loading;

  // Inspection State
  readonly inspectingFeature = signal<GlobalNominaFeature | null>(null);
  readonly activeTab = signal<'code' | 'view'>('code');
  readonly jsonInput = signal<string>('');

  // Computed parsed schema for view simulation
  readonly parsedSchema = computed(() => {
    const input = this.jsonInput().trim();
    if (!input) return null;
    try {
      return JSON.parse(input) as Record<string, any>;
    } catch {
      return null;
    }
  });

  // Confirmation State
  readonly featureToToggle = signal<GlobalNominaFeature | null>(null);
  readonly pendingToggleValue = signal<boolean>(false);
  readonly isToggling = signal<boolean>(false);

  // Toast State
  readonly successMessage = signal<string | null>(null);

  constructor() {}

  ngOnInit(): void {
    this._nominaFeatureService.getFeatures().pipe(takeUntilDestroyed(this._destroyRef)).subscribe();
  }

  handleToggleClick(event: Event, feature: GlobalNominaFeature): void {
    event.preventDefault(); // Prevents checkbox from changing immediately
    const input = event.target as HTMLInputElement;
    this.featureToToggle.set(feature);
    // The intended value is the opposite of the current state
    this.pendingToggleValue.set(!feature.is_active_globally);
  }

  confirmToggle(): void {
    const feature = this.featureToToggle();
    if (!feature) return;

    this.isToggling.set(true);
    const newValue = this.pendingToggleValue();

    this._nominaFeatureService
      .toggleFeature(feature.feature_key, { is_active_globally: newValue })
      .pipe(
        finalize(() => this.isToggling.set(false)),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe({
        next: () => {
          this.featureToToggle.set(null);
          this.showSuccessToast(
            `La característica "${feature.name}" ha sido ${newValue ? 'activada' : 'desactivada'} exitosamente.`,
          );
        },
        error: () => {
          this.featureToToggle.set(null);
        },
      });
  }

  cancelToggle(): void {
    this.featureToToggle.set(null);
  }

  private showSuccessToast(message: string): void {
    this.successMessage.set(message);
    setTimeout(() => {
      // Only clear if it's the same message (in case of rapid toggles)
      if (this.successMessage() === message) {
        this.successMessage.set(null);
      }
    }, 4000);
  }

  openInspectionModal(feature: GlobalNominaFeature): void {
    this.inspectingFeature.set(feature);
    this.activeTab.set('code');
    this.jsonInput.set(
      feature.schema_definition ? JSON.stringify(feature.schema_definition, null, 2) : '{\n\n}',
    );
  }

  closeInspectionModal(): void {
    this.inspectingFeature.set(null);
    this.jsonInput.set('');
  }
}
