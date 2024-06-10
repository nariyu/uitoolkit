type Callback = (delta: number) => void;

interface Updater {
  update: () => void;
}

export const now = (): number => {
  if (Date.now !== undefined) {
    return Date.now();
  } else {
    return new Date().getTime();
  }
};

/**
 * Ticker
 */
export class Ticker {
  private static callbacks: (Callback | Updater)[] = [];
  private static started = false;

  /**
   * add
   * @param callback
   */
  public static add(callback: Callback | Updater) {
    if (this.callbacks.indexOf(callback) !== -1) return false;
    this.callbacks.push(callback);

    if (!this.started) {
      this.started = true;
      let time1 = now();
      const update = () => {
        const time2 = now();
        const delta = Math.max(16, time2 - time1);
        time1 = time2;

        requestAnimationFrame(update);

        this.callbacks.forEach((cb) => {
          try {
            if (typeof cb !== 'function' && typeof cb.update === 'function') {
              cb.update();
            } else if (typeof cb === 'function') {
              cb(delta);
            }
          } catch (err) {
            console.error(err);
          }
        });
      };
      update();
    }

    return true;
  }

  /**
   * remove
   * @param callback
   */
  public static remove(callback: Callback | Updater) {
    const index = this.callbacks.indexOf(callback);
    if (index === -1) return;
    this.callbacks.splice(index, 1);
  }
}
