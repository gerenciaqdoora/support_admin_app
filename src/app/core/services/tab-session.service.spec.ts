import { TabSessionService } from './tab-session.service';

describe('TabSessionService', () => {
  let service: TabSessionService;

  beforeEach(() => (service = new TabSessionService()));
  afterEach(() => {
    service.destroy();
    sessionStorage.removeItem(TabSessionService.TAB_KEY);
  });

  it('una pestaña nueva no es copia y adopta un id', async () => {
    expect(await service.detectDuplicate()).toBe(false);
    expect(sessionStorage.getItem(TabSessionService.TAB_KEY)).toBeTruthy();
  });

  it('una recarga (nadie más tiene su id) conserva el id', async () => {
    sessionStorage.setItem(TabSessionService.TAB_KEY, 'tab-recargada');

    expect(await service.detectDuplicate()).toBe(false);
    expect(sessionStorage.getItem(TabSessionService.TAB_KEY)).toBe('tab-recargada');
  });

  it('detecta la copia cuando otra pestaña viva responde con el mismo id', async () => {
    sessionStorage.setItem(TabSessionService.TAB_KEY, 'tab-original');
    const original = new BroadcastChannel(TabSessionService.CHANNEL);
    original.onmessage = (event) => {
      if (event.data?.type === 'probe' && event.data.tabId === 'tab-original') {
        original.postMessage({ type: 'taken', tabId: 'tab-original' });
      }
    };

    expect(await service.detectDuplicate()).toBe(true);
    expect(sessionStorage.getItem(TabSessionService.TAB_KEY)).not.toBe('tab-original');
    original.close();
  });
});
