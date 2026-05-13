export interface GlobalNominaFeature {
  feature_key: string;
  name: string;
  is_active_globally: boolean;
  schema_definition: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
}

export interface ToggleNominaFeaturePayload {
  is_active_globally: boolean;
}

