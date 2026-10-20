export type ExpiryTone = 'info' | 'warning' | 'danger';

export interface ExpiryBadge {
  label: string;
  tone: ExpiryTone;
}

const DAY_MS = 86_400_000;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Badge del vencimiento del plan actual. null: el plan no vence. */
export function expiryBadge(
  status: string | null | undefined,
  endsAt: string | null | undefined,
  suspendsAt: string | null | undefined,
  now: Date,
): ExpiryBadge | null {
  if (status === 'suspended' || status === 'cancelled') return { label: 'Suspendido', tone: 'danger' };
  if (status === 'past_due') {
    return { label: suspendsAt ? `En gracia hasta ${formatDate(suspendsAt)}` : 'En gracia', tone: 'warning' };
  }
  if (!endsAt) return null;

  const days = Math.ceil((new Date(endsAt).getTime() - now.getTime()) / DAY_MS);
  if (days <= 0) return { label: 'Venció, pendiente de proceso', tone: 'warning' };
  if (days <= 7) return { label: `Vence en ${days} ${days === 1 ? 'día' : 'días'}`, tone: 'warning' };
  return { label: `Vence el ${formatDate(endsAt)}`, tone: 'info' };
}

export const EXPIRY_TONE_CLASS: Record<ExpiryTone, string> = {
  info: 'bg-slate-50 text-slate-600 border-slate-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-100',
  danger: 'bg-red-50 text-red-600 border-red-100',
};
