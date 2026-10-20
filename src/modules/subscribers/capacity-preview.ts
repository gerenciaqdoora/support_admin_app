export interface CapacityPreview {
  before: number;
  after: number;
  delta: number;
  usage: number;
}

/** Antes y después de sumar un cupo permanente al límite actual. */
export function capacityPreview(current: { limit: number; usage: number }, quantity: number): CapacityPreview {
  const delta = Number.isFinite(quantity) && quantity > 0 ? Math.trunc(quantity) : 0;
  return { before: current.limit, after: current.limit + delta, delta, usage: current.usage };
}
