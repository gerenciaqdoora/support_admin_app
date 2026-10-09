import { Injectable } from '@angular/core';

type TabMessage = { type: 'probe' | 'taken'; tabId: string };

/**
* "Duplicar pestaña" copia sessionStorage, y con él el refresh token. Si las dos pestañas lo usaran,
* la API vería un reuso y cerraría la sesión de ambas. Esta clase detecta la copia al arrancar.
*/
@Injectable({ providedIn: 'root' })
export class TabSessionService {
  static readonly CHANNEL = 'qdoora-tab-session';
  static readonly TAB_KEY = 'qdoora_tab_id';
  static readonly PROBE_TIMEOUT_MS = 150;

  private _channel: BroadcastChannel | null = null;
  private _tabId = '';

  /** Resuelve true si otra pestaña viva ya usa el id heredado (esta es la copia). */
  detectDuplicate(): Promise<boolean> {
    if (typeof BroadcastChannel === 'undefined') {
      return Promise.resolve(false);
    }

    const channel = new BroadcastChannel(TabSessionService.CHANNEL);
    this._channel = channel;
    const inherited = sessionStorage.getItem(TabSessionService.TAB_KEY);
    if (!inherited) {
      this._adopt(this._newId());
      return Promise.resolve(false);
    }

    return new Promise((resolve) => {
      const onTaken = (event: MessageEvent<TabMessage>) => {
        if (event.data?.type === 'taken' && event.data.tabId === inherited) {
          clearTimeout(timer);
          channel.removeEventListener('message', onTaken);
          this._adopt(this._newId());
          resolve(true);
        }
      };
      const timer = setTimeout(() => {
        channel.removeEventListener('message', onTaken);
        this._adopt(inherited);
        resolve(false);
      }, TabSessionService.PROBE_TIMEOUT_MS);

      channel.addEventListener('message', onTaken);
      channel.postMessage({ type: 'probe', tabId: inherited } satisfies TabMessage);
    });
  }

  destroy(): void {
    this._channel?.close();
    this._channel = null;
  }

  /** Toma el id y responde a las pestañas que pregunten si está en uso. */
  private _adopt(tabId: string): void {
    this._tabId = tabId;
    sessionStorage.setItem(TabSessionService.TAB_KEY, tabId);
    this._channel?.addEventListener('message', (event: MessageEvent<TabMessage>) => {
      if (event.data?.type === 'probe' && event.data.tabId === this._tabId) {
        this._channel?.postMessage({ type: 'taken', tabId: this._tabId } satisfies TabMessage);
      }
    });
  }

  // crypto.randomUUID solo existe en contextos seguros (https/localhost)
  private _newId(): string {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
}
