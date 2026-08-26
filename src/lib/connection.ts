/**
 * Tracks connectivity for the app: real navigator.onLine plus a manual
 * "forced offline" override so the offline-queue-and-sync flow can be
 * demoed deliberately (see the Rider page) without touching the real network.
 */
class ConnectionMonitor extends EventTarget {
  private forced = false;

  constructor() {
    super();
    window.addEventListener('online', () => this.dispatchEvent(new Event('change')));
    window.addEventListener('offline', () => this.dispatchEvent(new Event('change')));
  }

  isOnline(): boolean {
    return navigator.onLine && !this.forced;
  }

  setForcedOffline(value: boolean) {
    this.forced = value;
    this.dispatchEvent(new Event('change'));
  }
}

export const connectionMonitor = new ConnectionMonitor();
