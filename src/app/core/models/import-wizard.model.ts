export type ImportStepStatus = 'pending' | 'in_progress' | 'completed' | 'not_applicable';

export interface ImportStepSummary {
  imported: number;
  /** Fallidas en la última ejecución de la última sesión. */
  failed: number;
  last_at: string | null;
}

export interface ImportStep {
  code: string;
  order: number;
  title: string;
  description: string;
  status: ImportStepStatus;
  depends_on: string[];
  blocked: boolean;
  blocked_reason: string | null;
  summary: ImportStepSummary | null;
}

export interface ImportWizardProgress {
  /** Pasos Completados o marcados como No aplica. */
  completed: number;
  total: number;
}

export interface ImportWizardOverview {
  steps: ImportStep[];
  progress: ImportWizardProgress;
}
