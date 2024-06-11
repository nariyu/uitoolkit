type Listener<T, K extends keyof T> = (data: T[K]) => void;

/**
 * EventEmitter
 */
export class EventEmitter<T = unknown> {
  private listeners: { [key: string]: Listener<T, keyof T>[] } = {};

  /**
   * set event listener
   * @param type event type
   * @param listener event listener
   */
  public on<K extends keyof T>(type: K, listener: Listener<T, K>) {
    const listeners = this.listeners;

    const t = type as string;
    if (!listeners[t]) listeners[t] = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    listeners[t].push(listener as any);
    return this;
  }

  /**
   * unset event listener
   * @param type event type
   * @param listener event listener
   */
  public off<K extends keyof T>(type: K, listener?: Listener<T, K>) {
    const listeners = this.listeners;

    const t = type as string;
    if (!Object.prototype.hasOwnProperty.call(listeners, t)) return this;

    for (const eventType in listeners) {
      if (t !== eventType) continue;

      if (listener) {
        const typedListeners = listeners[eventType];
        for (let i = typedListeners.length - 1; i >= 0; i--) {
          if (typedListeners[i] === listener) {
            typedListeners.splice(i, 1);
          }
        }
        if (typedListeners.length === 0) {
          delete listeners[eventType];
        }
      } else {
        delete listeners[eventType];
      }
    }

    return this;
  }

  /**
   * emit event
   * @param type event type
   */
  public emit<K extends keyof T>(type: K, data?: Omit<T[K], "type">) {
    const listeners = this.listeners;

    const event: unknown = {
      ...(data || {}),
      target: this,
      type,
    };

    let callbacks: Listener<T, K>[] = [];
    for (const eventType in listeners) {
      if (!listeners[eventType]) continue;
      if (eventType !== type) continue;
      callbacks = callbacks.concat(listeners[eventType]);
    }
    for (const callback of callbacks) {
      callback.call(this, event as T[K]);
    }
    return this;
  }
}
