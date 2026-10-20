import { capacityPreview } from './capacity-preview';

describe('capacityPreview', () => {
  it('suma la cantidad al límite actual y muestra la diferencia', () => {
    expect(capacityPreview({ limit: 5, usage: 3 }, 4)).toEqual({ before: 5, after: 9, delta: 4, usage: 3 });
  });

  it('trata una cantidad vacía o inválida como cero', () => {
    expect(capacityPreview({ limit: 1, usage: 0 }, Number.NaN)).toEqual({ before: 1, after: 1, delta: 0, usage: 0 });
  });
});
