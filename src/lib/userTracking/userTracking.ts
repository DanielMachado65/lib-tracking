export type TrackingEventType = 'click' | 'input' | 'error' | 'rejection';

export interface TrackingEvent {
  id: string;
  type: TrackingEventType;
  timestamp: number;
  data?: unknown;
}

import { EventBus } from '../eventBus/eventBus';

export interface UserTrackingOptions {
  endpoint: string;
  bufferLimit?: number;
  bus?: EventBus;
  broadcastChannelName?: string;
}

export class UserTracking {
  private buffer: TrackingEvent[] = [];
  private readonly endpoint: string;
  private readonly bufferLimit: number;
  private readonly bus: EventBus;
  private channel?: BroadcastChannel;

  constructor(options: UserTrackingOptions) {
    this.endpoint = options.endpoint;
    this.bufferLimit = options.bufferLimit ?? 10;
    this.bus = options.bus ?? new EventBus();

    if (typeof BroadcastChannel !== 'undefined') {
      this.channel = new BroadcastChannel(options.broadcastChannelName ?? 'user-tracking');
      this.channel.addEventListener('message', (ev) => {
        const data = ev.data as TrackingEvent;
        this.pushEvent(data);
      });
    }
  }

  start(): void {
    if (typeof window === 'undefined') return;
    document.addEventListener('click', this.onClick, true);
    document.addEventListener('input', this.onInput, true);
    window.addEventListener('error', this.onError);
    window.addEventListener('unhandledrejection', this.onRejection);
    window.addEventListener('rejectionhandled', this.onRejection);
    window.addEventListener('beforeunload', () => this.flush());
  }

  stop(): void {
    if (typeof window === 'undefined') return;
    document.removeEventListener('click', this.onClick, true);
    document.removeEventListener('input', this.onInput, true);
    window.removeEventListener('error', this.onError);
    window.removeEventListener('unhandledrejection', this.onRejection);
    window.removeEventListener('rejectionhandled', this.onRejection);
  }

  private onClick = (e: Event): void => {
    const target = e.target as HTMLElement | null;
    const el = target?.closest('[data-event-id]') as HTMLElement | null;
    const id = el?.getAttribute('data-event-id');
    if (id) {
      this.pushEvent({ id, type: 'click', timestamp: Date.now() });
    }
  };

  private onInput = (e: Event): void => {
    const target = e.target as HTMLElement | null;
    const el = target?.closest('[data-event-id]') as HTMLElement | null;
    const id = el?.getAttribute('data-event-id');
    if (id) {
      this.pushEvent({ id, type: 'input', timestamp: Date.now() });
    }
  };

  private onError = (e: ErrorEvent): void => {
    this.pushEvent({
      id: 'global-error',
      type: 'error',
      timestamp: Date.now(),
      data: {
        message: e.message,
        filename: e.filename,
        lineno: e.lineno,
        colno: e.colno,
      },
    });
  };

  private onRejection = (e: PromiseRejectionEvent | Event): void => {
    const reason = (e as PromiseRejectionEvent).reason;
    this.pushEvent({
      id: 'unhandledrejection',
      type: 'rejection',
      timestamp: Date.now(),
      data: { reason },
    });
  };

  private pushEvent(event: TrackingEvent): void {
    this.buffer.push(event);
    this.bus.publish('tracking', event);
    if (this.channel) {
      this.channel.postMessage(event);
    }
    if (this.buffer.length >= this.bufferLimit) {
      this.flush();
    }
  }

  flush(): void {
    if (this.buffer.length === 0) return;
    const payload = JSON.stringify(this.buffer);
    this.buffer = [];
    try {
      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        navigator.sendBeacon(this.endpoint, payload);
      } else if (typeof fetch === 'function') {
        fetch(this.endpoint, {
          method: 'POST',
          body: payload,
          keepalive: true,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (_error) {
      // swallow
    }
  }
}

export function initUserTracking(options: UserTrackingOptions): UserTracking {
  const tracker = new UserTracking(options);
  tracker.start();
  return tracker;
}
