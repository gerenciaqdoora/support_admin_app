import { expiryBadge } from './plan-expiry';

describe('expiryBadge', () => {
  const now = new Date('2026-10-20T12:00:00-03:00');

  it('marca suspendido y cancelado en rojo', () => {
    expect(expiryBadge('suspended', null, null, now)).toEqual({ label: 'Suspendido', tone: 'danger' });
    expect(expiryBadge('cancelled', null, null, now)?.tone).toBe('danger');
  });

  it('en gracia muestra la fecha de suspensión', () => {
    const badge = expiryBadge('past_due', '2026-10-19T12:00:00-03:00', '2026-10-26T12:00:00-03:00', now);
    expect(badge?.label.startsWith('En gracia hasta')).toBe(true);
    expect(badge?.tone).toBe('warning');
  });

  it('avisa los días que faltan, el vencido sin procesar y no muestra nada sin vencimiento', () => {
    expect(expiryBadge('active', '2026-10-23T12:00:00-03:00', null, now)?.label).toBe('Vence en 3 días');
    expect(expiryBadge('active', '2026-10-21T12:00:00-03:00', null, now)?.label).toBe('Vence en 1 día');
    expect(expiryBadge('trialing', '2026-10-19T12:00:00-03:00', null, now)?.label).toBe('Venció, pendiente de proceso');
    expect(expiryBadge('active', '2026-12-20T12:00:00-03:00', null, now)?.tone).toBe('info');
    expect(expiryBadge('active', null, null, now)).toBeNull();
  });
});
